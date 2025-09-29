import { FileSystemBrokerAPI      } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { FileSystemBrokerCommands } from '../modules/commands.js';
import { getExtensionId, getExtensionName, formatMsToDateForFilename, formatMsToDateTime24HR, getMidnightMS } from '../utilities.js';


export class FsbEventLogger {
  constructor(fsbOptionsApi, logger) {
    this.CLASS_NAME                      = this.constructor.name;
    this.extId                           = getExtensionId();
    this.extName                         = getExtensionName();

    this.LOG                             = false;
    this.DEBUG                           = false;

    this.LOG_FILENAME_MATCH_GLOB         = "*.log";
    this.LOG_FILENAME_EXTENSION          = ".log";
    this.LOG_ARCHIVE_FILENAME_MATCH_GLOB = "*.alog";
    this.LOG_ARCHIVE_FILENAME_EXTENSION  = ".alog";

    this.logger                          = logger;
    this.fsbOptionsApi                   = fsbOptionsApi;
    this.fsbCommandsApi                  = new FileSystemBrokerCommands(this.logger);
    this.fsBrokerApi                     = new FileSystemBrokerAPI();
  }



  log(...info) {
    if (! this.LOG) return;
    const msg = info.shift();
    this.logger.log(this.CLASS_NAME + '#' + msg, ...info);
  }

  logAlways(...info) {
    const msg = info.shift();
    this.logger.logAlways(this.CLASS_NAME + '#' + msg, ...info);
  }

  debug(...info) {
    if (! this.DEBUG) return;
    const msg = info.shift();
    this.logger.debug(this.CLASS_NAME + '#' + msg, ...info);
  }

  debugAlways(...info) {
    const msg = info.shift();
    this.logger.debugAlways(this.CLASS_NAME + '#' + msg, ...info);
  }

  error(...info) {
    // always log errors
    const msg = info.shift();
    this.logger.error(this.CLASS_NAME + '#' + msg, ...info);
  }

  caught(e, ...info) {
    // always log errors
    const msg = info.shift();
    this.logger.error( this.CLASS_NAME + '#' + msg,
                       "\n- error.name:    " + e.name,
                       "\n- error.message: " + e.message,
                       "\n- error.stack:   " + e.stack,
                       "\n",
                       ...info
                     );
  }



  async logInternalEvent(eventType, stat, parameters, description) {
    if (await this.fsbOptionsApi.isEnabledInternalEventLogging()) {
      await this.logEvent("INTERNAL", eventType, stat, parameters, description);
    }
  }



  async logEvent(senderId, eventType, stat, parameters, description) {
    const timeMS        = Date.now();
    const logFileName   = formatMsToDateForFilename(timeMS) + this.LOG_FILENAME_EXTENSION;
    const formattedTime = formatMsToDateTime24HR(timeMS);

    const logMsg = {
      "timeMS":     timeMS,
      "time":       formattedTime,
      "sender":     senderId,
      "type":       "event",
      "command":    eventType,
      "status":     stat,
      "result":     description
    };
    if (parameters != null) {
      if (typeof parameters === 'object') {
        this.fsbCommandsApi.addCommandToObject(parameters, logMsg);
      } else if (typeof parameters === 'string') {
        logMsg.parameters = parameters;
      }
    }

    // We cannot use writeObjectToJSONFile because it does not support APPEND modes
    const json = JSON.stringify(logMsg) + "\n";
    const bytesWritten = messenger.BrokerFileSystem.writeFile(this.extId, logFileName, json, "appendOrCreate" );
  }



  async logCommand(timeMS, senderId, command) {
    const logFileName   = formatMsToDateForFilename(timeMS) + this.LOG_FILENAME_EXTENSION;
    const formattedTime = formatMsToDateTime24HR(timeMS);

    const logMsg = {
      "timeMS": timeMS,
      "time":   formattedTime,
      "sender": senderId,
      "type":   "command",
      "status": "request"
    };
    this.fsbCommandsApi.addCommandToObject(command, logMsg);

    // We cannot use writeObjectToJSONFile because it does not support APPEND modes
    const json = JSON.stringify(logMsg) + "\n";
    const bytesWritten = messenger.BrokerFileSystem.writeFile(this.extId, logFileName, json, "appendOrCreate" );
  }



  async logCommandResult(timeMS, senderId, command, result) {
    const logFileName     = formatMsToDateForFilename(timeMS) + this.LOG_FILENAME_EXTENSION;
    const formattedTime   = formatMsToDateTime24HR(timeMS);
    const formattedResult = (typeof result === 'object') ? this.fsbCommandsApi.formatCommandResult(command, result) : result; // MABXXX handle string vs object inside the function

    const logMsg = {
      "timeMS": timeMS,
      "time":   formattedTime,
      "sender": senderId,
      "type":   "result",
      "status": result.error ? "error" : result.invalid ? "invalid" : "success"
    };
    this.fsbCommandsApi.addCommandToObject(command, logMsg);
    logMsg["result"] = formattedResult;

    // We cannot use writeObjectToJSONFile because it does not support APPEND modes
    const json = JSON.stringify(logMsg) + "\n";
    const bytesWritten = messenger.BrokerFileSystem.writeFile(this.extId, logFileName, json, "appendOrCreate" );
  }



  // if numDays == 0 just delete them all, regardless
  // if optional archives parameter is true, delete archived log files */
  //
  // Does NOT use the FilSystemBroker API, so this MAY be called from background.js,
  // where the message listeners are defined.
  async deleteOldEventLogs(numDays, archives) {
    this.debugAlways(`deleteOldEventLogs -- begin -- numDays=${numDays} archives=${archives}`);

    const deleteArchives           = (typeof archives === 'boolean') ? archives : false;
    const deleteFilesOlderThanMS   = (numDays == 0) ? 0  : getMidnightMS(Date.now(), -numDays);
    const deleteFilesOlderThanTime = (numDays == 0) ? "" : formatMsToDateTime24HR(deleteFilesOlderThanMS);

    const parameters = (numDays == 0) ? { 'numDays': numDays, 'archives': deleteArchives }
                                      : { 'numDays': numDays, 'olderThan': deleteFilesOlderThanTime, 'archives': deleteArchives };
    await this.logInternalEvent("deleteOldEventLogs", "request", parameters, "");
    
    var   numDeleted       = 0;
    const deletedFileNames = [];
    const fileInfo         = await this.getLogFileInfo(archives);
    if (! fileInfo) {
      // errors should already have been recorded in getLogFileInfo()
      await this.logInternalEvent("deleteOldEventLogs", "error", parameters, "Failed to get Log File Info");

    } else if (fileInfo.length < 1) {
      await this.logInternalEvent("deleteOldEventLogs", "success", parameters, "No Log Files");

    } else {
      this.debugAlways(`deleteOldEventLogs -- Delete ${deleteArchives? "Archived " : ""}Log Files older than days=${numDays} ms=${deleteFilesOlderThanMS} time="${deleteFilesOlderThanTime}"`);

      for (const info of fileInfo) {
        if (true || this.DEBUG) {
          if (numDays == 0) {
            this.debugAlways(`deleteOldEventLogs -- file "${info.fileName}" numDays==0`);
          } else {
            const fileCreationDateTime    = formatMsToDateTime24HR(info.creationTime);
            const fileLasModifiedDateTime = formatMsToDateTime24HR(info.lastModified);
            this.debugAlways(`deleteOldEventLogs -- file "${info.fileName}" -- creationTime: "${fileCreationDateTime}" (${info.creationTime}) -- lastModified: "${fileLasModifiedDateTime}" (${info.lastModified}) `);
          }
        }

        // MABXXX using last modified time instead of creation time
        // Windows doesn't seem to set creation time as I would expect
////////if (numDays == 0 || info.creationTime < deleteFilesOlderThanMS) {
        if (numDays == 0 || info.lastModified < deleteFilesOlderThanMS) {
          this.debugAlways(`deleteOldEventLogs -- Deleting file "${info.fileName}"`);
          const response = await this.deleteLogFile(info.fileName);
          // errors should already have been recorded in deleteLogFile()
          if (response.deleted) {
            numDeleted++;
            deletedFileNames.push(info.fileName);
          }
        }
      }

      await this.logInternalEvent("deleteOldEventLogs", "success", parameters, `${numDeleted} Log Files deleted`);
    }

    this.debugAlways(`deleteOldEventLogs -- end -- numDeleted: ${numDeleted}`);

    return deletedFileNames;
  }

  // if optional archives parameter is true, get archived log FileInfo
  //
  // Does NOT use the FilSystemBroker API, so this MAY be called from background.js,
  // where the message listeners are defined.
  async getLogFileInfo(archives) {
    const deleteArchives = (typeof archives === 'boolean') ? archives : false;
    const matchGLOB      = deleteArchives ? this.LOG_ARCHIVE_FILENAME_MATCH_GLOB : this.LOG_FILENAME_MATCH_GLOB;
    const parameters     = {  'archives': deleteArchives, 'matchGLOB': matchGLOB};

    this.debugAlways(`getLogFileInfo -- archives=${archives} matchGLOB="${matchGLOB}"`);
    await this.logInternalEvent("getLogFileInfo", "request", parameters, "");

    var logFileInfo;
    try {
      logFileInfo = await messenger.BrokerFileSystem.listFileInfo(this.extId, matchGLOB);
      if (! logFileInfo) {
        await this.logInternalEvent("getLogFileInfo", "error", parameters, "No Log FileInfo");
      } else {
        await this.logInternalEvent("getLogFileInfo", "success", parameters, `Got ${logFileInfo.length} Log Files`);
      }
    } catch (error) {
      this.caught(error, "getLogFileInfo");
      await this.logInternalEvent("getLogFileInfo", "error", parameters, `EXCEPTION -- ${error.name}: ${error.message}`);
    }

    return logFileInfo;
  }

  /* if optional archives parameter is true, list archived log FileInfo
   *
   * returns { "fileInfo": [],    "length": number } array of FileInfo - see the FileSystemBroker API README file
   *         { "error":    string                  } If there was some error getting the file info. The returned string gives the reason.
   *
   * Uses the FilSystemBroker API, so this may NOT be called from background.js,
   * where the listeners are defined.
   */
  async listLogFileInfo(archives) {
    const deleteArchives = (typeof archives === 'boolean') ? archives : false;
    const matchGLOB      = deleteArchives ? this.LOG_ARCHIVE_FILENAME_MATCH_GLOB : this.LOG_FILENAME_MATCH_GLOB;

    try {
      this.debug(`listLogFileInfo -- Getting list of log files with matchGLOB "${matchGLOB}"`);
      const response = await this.fsBrokerApi.listFileInfo(matchGLOB);
      this.debug(`listLogFileInfo --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "listLogFileInfo -- Unexpected Error");
      return { "error": error.name + ": " + error.message };
    }
  }

  async deleteLogFile(fileName) {
    try {
      this.debug(`deleteLogFile -- Deleting log file "${fileName}"`);
      const response = await this.fsBrokerApi.deleteFile(fileName);
      this.debug(`deleteLogFile --response: "${response}"`);

      if (! response) {
        this.error(`deleteLogFile -- FAILED TO DELETE LOG FILE -- NO RESPONSE RETURNED -- fileName="${fileName}"`);
      } else if (response.invalid) {
        this.error(`deleteLogFile -- FAILED TO DELETE LOG FILE -- INVALID RETURNED -- fileName="${fileName}" -- response.invalid="&{response.invalid}"`);
      } else if (response.error) {
        this.error(`deleteLogFile -- FAILED TO DELETE LOG FILE -- ERROR RETURNED -- fileName="${fileName}" -- response.error="&{response.error}"`);
      } else if (! response.fileName) {
        this.error(`deleteLogFile -- FAILED TO DELETE LOG FILE -- NO FILENAME RETURNED -- fileName="${fileName}"`);
      } else if (! response.deleted) {
        this.error(`deleteLogFile -- FAILED TO DELETE LOG FILE -- fileName="${fileName}" not deleted`);
      } else {
        this.debug(`deleteLogFile -- Log File Deleted -- fileName="${response.fileName}" response.deleted="${response.deleted}"`);
      }

      return response;

    } catch (error) {
      this.caught(error, `deleteLogFile --  Failed to delete log file "${fileName}"`);
      return { "error": error.name + ": " + error.message };
    }
  }
}
