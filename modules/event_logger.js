import { FileSystemBrokerAPI      } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { FileSystemBrokerCommands } from '../modules/commands.js';
import { getExtensionId, getExtensionName, formatMsToDateForFilename, formatMsToDateTime24HR, getMidnightMS } from '../utilities.js';


export class FsbEventLogger {
  constructor(fsbOptionsApi, logger) {
    this.CLASS_NAME              = this.constructor.name;
    this.extId                   = getExtensionId();
    this.extName                 = getExtensionName();

    this.LOG                     = false;
    this.DEBUG                   = false;

    this.LOG_FILENAME_MATCH_GLOB = "*.log";
    this.LOG_FILENAME_EXTENSION  = ".log";

    this.logger                  = logger;
    this.fsbOptionsApi           = fsbOptionsApi;
    this.fsbCommandsApi          = new FileSystemBrokerCommands(this.logger);
    this.fsBrokerApi             = new FileSystemBrokerAPI();
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

    // We cannot use writeObjectToJSONFile because it does not support APPEND modes
    const json = JSON.stringify(logMsg) + "\n";
    const response = messenger.BrokerFileSystem.writeFile(this.extId, logFileName, json, "appendOrCreate" );
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
    const response = messenger.BrokerFileSystem.writeFile(this.extId, logFileName, json, "appendOrCreate" );
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
    const response = messenger.BrokerFileSystem.writeFile(this.extId, logFileName, json, "appendOrCreate" );
  }



  async deleteOldLogFiles(numDays) {
    this.debugAlways(`deleteOldLogFiles -- begin -- numDays=${numDays}`);

    const parameters = { 'numDays': numDays };
    await this.logInternalEvent("deleteOldLogFiles", "request", parameters, "");
    
    var   deleted  = 0;
    const fileInfo = await this.getLogFileInfo();
    if (! fileInfo) {
      // errors should already have been recorded in getLogFileInfo()
      await this.logInternalEvent("deleteOldLogFiles", "error", parameters, "Failed to get Log Files list");

    } else if (fileInfo.length < 1) {
      await this.logInternalEvent("deleteOldLogFiles", "success", parameters, "No Log Files");

    } else {
      const deleteFilesOlderThanMS = getMidnightMS(Date.now(), -numDays);
      const deleteFilesOlderThan   = formatMsToDateTime24HR(deleteFilesOlderThanMS);
      this.debugAlways(`deleteOldLogFiles -- Delete Log Files older than days=${numDays} ms=${deleteFilesOlderThanMS} date="${deleteFilesOlderThan}"`);

      for (const info of fileInfo) {
        if (true || this.DEBUG) {
          const fileCreationDateTime = formatMsToDateTime24HR(info.creationTime);
          this.debugAlways(`deleteOldLogFiles -- file "${info.fileName}" creationTime: "${fileCreationDateTime}" (${info.creationTime})`);
        }
        if (info.creationTime < deleteFilesOlderThanMS) {
          this.debugAlways(`deleteOldLogFiles -- Deleting file "${info.fileName}"`);
          const response = await this.deleteLogFile(info.fileName);
          // errors should already have been recorded in deleteLogFile()
          if (response.deleted) deleted++;
        }
      }

      await this.logInternalEvent("deleteOldLogFiles", "success", parameters, `${deleted} Log Files deleted`);
    }

    this.debugAlways(`deleteOldLogFiles -- end -- deleted: ${deleted}`);
  }

  async getLogFileInfo() {
await this.logInternalEvent("listLogFileInfo", "request", null, "LIST FILEINFO");
    let listLogFileInfoResponse;
    try {
      listLogFileInfoResponse = await this.listLogFileInfo();
    } catch (error) {
      this.caught(error, " -- getLogFileInfo");
await this.logInternalEvent("listLogFileInfo", "error", null, `LIST FILEINFO -- EXCEPTION: "${error.name}" -- "${error.message}" `);
    }

    if (! listLogFileInfoResponse) {
      this.error("getLogFileInfo -- listLogFileInfo -- LIST FILEINFO - NO RESPONSE");
await this.logInternalEvent("listLogFileInfo", "error", null, "LIST FILEINFO -- NO RESPONSE");
    } else if (listLogFileInfoResponse.invalid) {
      this.error(`getLogFileInfo -- listLogFileInfo -- LIST FILEINFO ERROR: ${listLogFileInfoResponse.invalid}`);
await this.logInternalEvent("listLogFileInfo", "error", null, `LIST FILEINFO -- ERROR: ${listLogFileInfoResponse.invalid}`);
    } else if (listLogFileInfoResponse.error) {
      this.error(`getLogFileInfo -- listLogFileInfo -- LIST FILEINFO ERROR: ${listLogFileInfoResponse.error}`);
await this.logInternalEvent("listLogFileInfo", "error", null, `LIST FILEINFO -- ERROR: ${listLogFileInfoResponse.invalid}`);
    } else if (! listLogFileInfoResponse.fileInfo) {
      this.error("getLogFileInfo -- listLogFileInfo -- NO FILEINFO RETURNED");
await this.logInternalEvent("listLogFileInfo", "error", null, "LIST FILEINFO -- NO FILEINFO RETURNED");
    } else {
await this.logInternalEvent("listLogFileInfo", "success", null, `LIST FILEINFO -- RETURNED LENGTH ${listLogFileInfoResponse.fileInfo.length}`);
      return listLogFileInfoResponse.fileInfo
    }
  }

  /* returns { "fileInfo": [],    "length": number } array of FileInfo - see the FileSystemBroker API README file
   *         { "error":    string                  } If there was some error writing the file. The returned string gives the reason.
   */
  async listLogFileInfo() {
    try {
      const matchGLOB = this.LOG_FILENAME_MATCH_GLOB;
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
