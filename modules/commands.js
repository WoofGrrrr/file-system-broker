////import { Options } from '../modules/options.js';
////import { Logger  } from '../modules/logger.js';
import { formatMsToDateTime12HR, formatMsToDateTime24HR } from './utilities.js';

export class FileSystemBrokerCommands {
  /* one day I hope to use options to set the logging levels */

  constructor(logger) {
    this.CLASS_NAME    = this.constructor.name;

    this.LOG           = false;
    this.DEBUG         = false;

    this.logger        = logger;
////this.fsbOptionsApi = new Options(this.logger);

    this.commands = [
      "access",
      "exists",
      "isRegularFile",
      "isDirectory",
      "hasFiles",
      "getFileCount",
      "writeFile",
      "replaceFile",
      "appendToFile",
      "writeJSONFile",
      "writeObjectToJSONFile",
      "readFile",
      "readJSONFile",
      "readObjectFromJSONFile",
      "makeDirectory",
      "getFileInfo",
      "renameFile",
      "deleteFile",
      "deleteDirectory",
      "listFiles",
      "listFileInfo",
      "list",
      "listInfo",
      "getFullPathName",
      "isValidFileName",
      "isValidDirectoryName",
      "getFileSystemPathName"
    ];
    Object.freeze(this.commands);
  }



  log(...info) {
    if (! this.LOG) return;
    const msg = info.shift();
    this.logger.log(this.CLASS_NAME + "#" + msg, ...info);
  }

  logAlways(...info) {
    const msg = info.shift();
    this.logger.logAlways(this.CLASS_NAME + "#" + msg, ...info);
  }

  debug(...info) {
    if (! this.DEBUG) return;
    const msg = info.shift();
    this.logger.debug(this.CLASS_NAME + "#" + msg, ...info);
  }

  debugAlways(...info) {
    const msg = info.shift();
    this.logger.debugAlways(this.CLASS_NAME + "#" + msg, ...info);
  }

  error(...info) {
    // always log errors
    const msg = info.shift();
    this.logger.error(this.CLASS_NAME + "#" + msg, ...info);
  }

  caught(e, ...info) {
    // always log exceptions
    const msg = info.shift();
    this.logger.error( this.CLASS_NAME + "#" + msg,
                       "\n name:    " + e.name,
                       "\n command: " + e.message,
                       "\n stack:   " + e.stack,
                       ...info
                     );
  }



  getCommandList() {
    return this.commands;
  }



  async processCommand(command, extensionId) {    
    if (! command) {
      this.error("processCommand -- No Command parameter");
      return ( { "error": "Invalid Request: No Command.command parameter", "code": "400" } );
    } else if (typeof command !== 'object') {
      this.error("processCommand -- Command parameter is not an object");
      return ( { "error": "Invalid Request: Command.command parameter is not an object", "code": "400" } );
    } else if (! command.command) {
      this.error("processCommand -- Command has no command parameter");
      return ( { "error": "Invalid Request: Command has no command parameter", "code": "400" } );
    } else if (typeof command.command !== 'string') {
      this.error(`processCommand -- Command.command parameter is NOT A STRING`);
      return ( { "error": "Invalid Request: Invalid Command - Command.command parameter is not a String", "code": "400" } );
    }

    if (! extensionId) {
      this.error("processCommand -- No extensionId");
      return ( { "error": "Invalid Request: Invalid Command - no extensionId parameter", "code": "400" } );
    } else if (typeof extensionId !== 'string') {
      this.error("processCommand -- extensionId parameter is NOT A STRING");
      return ( { "error": "Invalid Request: Invalid Command", "code": "400" } );
    } else if (! this.checkValidExtensionId(extensionId)) {
      this.error(`processCommand -- extensionId parameter is invalid: "${extensionId}"`);
      return ( { "error": "Invalid Request: Invalid Command", "code": "400" } );
    }

    // MABXXX Use an Object where key is command name and value is another object
    //        with key "process" and value function process()
    //        & key "formatResult" and value function formatResult()
    //        etc
    switch(command.command) {
      case "access": // this command must be handled where access control is handled, which is in background.js for now
        return { "access": "unknown" };
      case "exists":
        return this.existsCommand(command, extensionId);
      case "isRegularFile":
        return this.isRegularFileCommand(command, extensionId);
      case "isDirectory":
        return this.isDirectoryCommand(command, extensionId);
      case "hasFiles":
        return this.hasFilesCommand(command, extensionId);
      case "getFileCount":
        return this.getFileCountCommand(command, extensionId);
      case "writeFile":
        return this.writeFileCommand(command, extensionId);
      case "replaceFile":
        return this.replaceFileCommand(command, extensionId);
      case "appendToFile":
        return this.appendToFileCommand(command, extensionId);
      case "writeJSONFile":
        return this.writeJSONFileCommand(command, extensionId);
      case "writeObjectToJSONFile":
        return this.writeObjectToJSONFileCommand(command, extensionId);
      case "readFile":
        return this.readFileCommand(command, extensionId);
      case "readJSONFile":
        return this.readJSONFileCommand(command, extensionId);
      case "readObjectFromJSONFile":
        return this.readObjectFromJSONFileCommand(command, extensionId);
      case "getFileInfo":
        return this.getFileInfoCommand(command, extensionId);
      case "renameFile":
        return this.renameFileCommand(command, extensionId);
      case "deleteFile":
        return this.deleteFileCommand(command, extensionId);
      case "deleteDirectory":
        return this.deleteDirectoryCommand(command, extensionId);
      case "makeDirectory":
        return this.makeDirectoryCommand(command, extensionId);
      case "listFiles":
        return this.listFilesCommand(command, extensionId);
      case "listFileInfo":
        return this.listFileInfoCommand(command, extensionId);
      case "list":
        return this.listCommand(command, extensionId);
      case "listInfo":
        return this.listInfoCommand(command, extensionId);
      case "getFullPathName":
        return this.getFullPathNameCommand(command, extensionId);
      case "isValidFileName":
        return this.isValidFileNameCommand(command, extensionId);
      case "isValidDirectoryName":
        return this.isValidDirectoryNameCommand(command, extensionId);
      case "getFileSystemPathName":
        return this.getFileSystemPathNameCommand(command, extensionId);
    }

    return this.unknownCommand(command, extensionId);
  }



  async existsCommand(command, extensionId) {
    this.debug(`existsCommand -- command.fileName ="${command.fileName}"`);

    if (command.fileName) { // fileName is optional
      if ((typeof command.fileName) !== 'string') {
        this.debug("existsCommand -- Message 'fileName' parameter type is not 'string'");
        return ( { "invalid": "exists Command: 'fileName' parameter type must be 'string'" } );
      }

      if (! this.checkValidFileName(command.fileName)) {
        this.debug(`existsCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
        return ( { "invalid": `exists Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
      }
    }

    try {
      this.debug(`existsCommand -- checking if file "${command.fileName}" exists for extension "${extensionId}"`);
      const exists = await messenger.BrokerFileSystem.exists(extensionId, command.fileName);
      if (command.fileName) { // fileName is optional
        this.debug(`existsCommand -- fileName="${command.fileName}" exists=${exists}`);
        return ( { "fileName": command.fileName, "exists": exists } );
      }

      this.debug(`existsCommand -- fileName="${extensionId}" exists=${exists}`);
      return ( { "fileName": extensionId, "exists": exists } );

    } catch (error) {
      if (command.fileName) { // fileName is optional
        this.caught(error, `existsCommand -- Caught error while checking if file "${command.fileName}" exists:`);
      } else {
        this.caught(error, `existsCommand -- Caught error while checking if file "${extensionId}" exists:`);
      }
      return ( { "error": `Error Processing exists Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async isRegularFileCommand(command, extensionId) {
    this.debug(`isRegularFileCommand -- command.fileName ="${command.fileName}"`);

    if (! command.fileName) {
      this.debug("isRegularFileCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "isRegularFile Command: no 'fileName' parameter" } );
    } else if ((typeof command.fileName) !== 'string') {
      this.debug("isRegularFileCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "isRegularFile Command: 'fileName' parameter type must be 'string'" } );
    }

    if (! this.checkValidFileName(command.fileName)) {
      this.debug(`isRegularFileCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
      return ( { "invalid": `isRegularFile Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
    }

    try {
      this.debug(`isRegularFileCommand -- checking if file "${command.fileName}" exists and is a Regular File for extension "${extensionId}"`);
      const isRegularFile = await messenger.BrokerFileSystem.isRegularFile(extensionId, command.fileName);
      this.debug(`isRegularFileCommand -- fileName="${command.fileName}" isRegularFile=${isRegularFile}`);
      return ( { "fileName": command.fileName, "isRegularFile": isRegularFile } );

    } catch (error) {
      this.caught(error, `isRegularFileCommand -- Caught error while checking if file "${command.fileName}" exists and is a Regular File:`);
      return ( { "error": `Error Processing isRegularFile Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async isDirectoryCommand(command, extensionId) {
    this.debug(`isDirectoryCommand -- command.directoryName ="${command.directoryName}"`);

    if (command.directoryName) { // directoryName is optional
      if ((typeof command.directoryName) !== 'string') {
        this.debug("isDirectoryCommand -- Message 'directoryName' parameter type is not 'string'");
        return ( { "invalid": "isDirectory Command: 'directoryName' parameter type must be 'string'" } );
      }

      if (! this.checkValidDirName(command.directoryName)) {
        this.debug(`isDirectoryCommand -- Message 'directoryName' parameter is invalid: "${command.directoryName}"`);
        return ( { "invalid": `isDirectory Command: 'directoryName' parameter is invalid: "${command.directoryName}"` } );
      }
    }

    try {
      this.debug(`isDirectoryCommand -- checking if file "${command.directoryName}" exists and is a Directory for extension "${extensionId}"`);
      const isDirectory = await messenger.BrokerFileSystem.isDirectory(extensionId, command.directoryName);
      if (command.directoryName) { // directoryName is optional
        this.debug(`isDirectoryCommand -- directoryName="${command.directoryName}" isDirectory=${isDirectory}`);
        return ( { "directoryName": command.directoryName, "isDirectory": isDirectory } );
      }

      this.debug(`isDirectoryCommand -- directoryName="${extensionId}" isDirectory=${isDirectory}`);
      return ( { "directoryName": extensionId, "isDirectory": isDirectory } );

    } catch (error) {
      if (command.directoryName) { // directoryName is optional
        this.caught(error, `isDirectoryCommand -- Caught error while checking if file "${command.directoryName}" exists and is a Directory:`);
      } else {
        this.caught(error, `isDirectoryCommand -- Caught error while checking if file "${extensionId}" exists and is a Directory:`);
      }
      return ( { "error": `Error Processing isDirectory Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async hasFilesCommand(command, extensionId) {
    this.debug(`hasFilesCommand -- command.directoryName ="${command.directoryName}"`);

    if (command.directoryName) { // directoryName is optional
      if ((typeof command.directoryName) !== 'string') {
        this.debug("hasFilesCommand -- Message 'directoryName' parameter type is not 'string'");
        return ( { "invalid": "hasFiles Command: 'directoryName' parameter type must be 'string'" } );
      }

      if (! this.checkValidDirName(command.directoryName)) {
        this.debug(`hasFilesCommand -- Message 'directoryName' parameter is invalid: "${command.directoryName}"`);
        return ( { "invalid": `hasFiles Command: 'directoryName' parameter is invalid: "${command.directoryName}"` } );
      }
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId, command.directoryName);
      if (! exists) {
        if (command.directoryName) { // directoryName is optional
          this.debug(`hasFilesCommand -- Directory does not exist: "${command.directoryName}" for extension "${extensionId}"`);
          return ( { "invalid": `hasFiles Command: Directory does not exist: "${command.directoryName}" for extension "${extensionId}"` } );
        } 
        this.debug(`hasFilesCommand -- Directory does not exist: "${extensionId}"`);
        return ( { "invalid": `hasFiles Command: Directory does not exist: "${extensionId}"` } );
      }

      const isDirectory = await messenger.BrokerFileSystem.isDirectory(extensionId, command.directoryName);
      if (! isDirectory) {
        if (command.directoryName) { // directoryName is optional
          this.debug(`hasFilesCommand -- File is not a Directory: "${command.directoryName}" for extension "${extensionId}"`);
          return ( { "invalid": `hasFiles Command: File is not a Directory: "${command.directoryName}" for extension "${extensionId}"` } );
        }
        this.debug(`hasFilesCommand -- File is not a Directory: "${extensionId}"`);
        return ( { "invalid": `hasFiles Command: File is not a Directory: "${extensionId}"` } );
      }
    } catch (error) {
      if (command.directoryName) { // directoryName is optional
        this.caught(error, `hasFilesCommand -- Caught error while checking if File "${command.directoryName}" for extension "${extensionId}" exists and is a Directory:`);
      } else {
        this.caught(error, `hasFilesCommand -- Caught error while checking if File "${extensionId}" exists and is a Directory:`);
      }
      return ( { "error": `Error Processing hasFiles Command: ${error.message}`, "code": "500" } );
    }

    try {
      this.debug(`hasFilesCommand -- checking if file "${command.directoryName}" exists, is a Directory for extension "${extensionId}", and contains files`);
      const hasFiles = await messenger.BrokerFileSystem.hasFiles(extensionId, command.directoryName);
      if (command.directoryName) { // directoryName is optional
        this.debug(`hasFilesCommand -- directoryName="${command.directoryName}" hasFiles=${hasFiles}`);
        return ( { "directoryName": command.directoryName, "hasFiles": hasFiles } );
      }

      this.debug(`hasFilesCommand -- directoryName="${extensionId}" hasFiles=${hasFiles}`);
      return ( { "directoryName": extensionId, "hasFiles": hasFiles } );

    } catch (error) {
      if (command.directoryName) { // directoryName is optional
        this.caught(error, `hasFilesCommand -- Caught error while checking if file "${command.directoryName}" for extention "${extensionId}" contains files:`);
      } else {
        this.caught(error, `hasFilesCommand -- Caught error while checking if file "${extensionId}" contains files:`);
      }
      return ( { "error": `Error Processing hasFiles Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async getFileCountCommand(command, extensionId) {
    this.debug(`getFileCountCommand -- command.directoryName ="${command.directoryName}"`);

    if (command.directoryName) { // directoryName is optional
      if ((typeof command.directoryName) !== 'string') {
        this.debug("getFileCountCommand -- Message 'directoryName' parameter type is not 'string'");
        return ( { "invalid": "getFileCount Command: 'directoryName' parameter type must be 'string'" } );
      }

      if (! this.checkValidDirName(command.directoryName)) {
        this.debug(`getFileCountCommand -- Message 'directoryName' parameter is invalid: "${command.directoryName}"`);
        return ( { "invalid": `getFileCount Command: 'directoryName' parameter is invalid: "${command.directoryName}"` } );
      }
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId, command.directoryName);
      if (! exists) {
        if (command.directoryName) { // directoryName is optional
          this.debug(`getFileCountCommand -- Directory does not exist: "${command.directoryName}"`);
          return ( { "invalid": `getFileCount Command: Directory does not exist: "${command.directoryName}"` } );
        } 
        this.debug(`getFileCountCommand -- Directory does not exist: "${extensionId}"`);
        return ( { "invalid": `getFileCount Command: Directory does not exist: "${extensionId}"` } );
      }

      const isDirectory = await messenger.BrokerFileSystem.isDirectory(extensionId, command.directoryName);
      if (! isDirectory) {
        if (command.directoryName) { // directoryName is optional
          this.debug(`hasFilesCommand -- File is not a Directory: "${command.directoryName}"`);
          return ( { "invalid": `hasFiles Command: File is not a Directory: "${command.directoryName}"` } );
        }
        this.debug(`hasFilesCommand -- File is not a Directory: "${extensionId}"`);
        return ( { "invalid": `hasFiles Command: File is not a Directory: "${extensionId}"` } );
      }
    } catch (error) {
      if (command.directoryName) { // directoryName is optional
        this.caught(error, `getFileCountCommand -- Caught error while checking if file "${command.directoryName}" for extention "${extensionId}" exists and is a Directory:`);
      } else {
        this.caught(error, `getFileCountCommand -- Caught error while checking if file "${extensionId}" exists and is a Directory:`);
      }
      return ( { "error": `Error Processing getFileCount Command: ${error.message}`, "code": "500" } );
    }

    try {
      this.debug(`getFileCount -- checking if file "${command.directoryName}" exists, is a Directory for extension "${extensionId}", and contains files`);
      const fileCount = await messenger.BrokerFileSystem.getFileCount(extensionId, command.directoryName);
      if (command.directoryName) { // directoryName is optional
        this.debug(`getFileCountCommand -- directoryName="${command.directoryName}" fileCount=${fileCount}`);
        return ( { "directoryName": command.directoryName, "fileCount": fileCount } );
      }

      this.debug(`getFileCountCommand -- directoryName="${extensionId}" fileCount=${fileCount}`);
      return ( { "directoryName": extensionId, "fileCount": fileCount } );

    } catch (error) {
      if (command.directoryName) { // directoryName is optional
        this.caught(error, `getFileCountCommand -- Caught error while getting the file count for Directory "${command.directoryName}" for extension "${extensionId}":`);
      } else {
        this.caught(error, `getFileCountCommand -- Caught error while getting the file count for Directory "${extensionId}":`);
      }
      return ( { "error": `Error Processing getFileCount Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async writeFileCommand(command, extensionId) {
    this.debug(`writeFileCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName ="${command.fileName }"`);

    if (! command.fileName) {
      this.debug("writeFileCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "writeFile Command: no 'fileName' parameter" } );
    } else if ((typeof command.fileName) !== 'string') {
      this.debug("writeFileCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "writeFile Command: 'fileName' parameter type must be 'string'" } );
    }

    if (typeof command.data === 'undefined' || command.data == null) {
      this.debug("writeFileCommand -- Message has no 'data' parameter");
      return ( { "invalid": "writeFile Command: no 'data' parameter" } );
    } else if ((typeof command.data) !== 'string') {
      this.debug("writeFileCommand -- Message 'data' parameter type is not 'string'");
      return ( { "invalid": "writeFile Command: 'data' parameter type must be 'string'" } );
    }

    if (! this.checkValidFileName(command.fileName)) {
      this.debug(`writeFileCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
      return ( { "invalid": `writeFile Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
    }

    if (command.writeMode && ! checkWriteMode(command.writeMode)) {
      this.debug(`writeFileCommand -- Message 'writeMode' parameter is invalid: "${command.writeMode}"`);
      return ( { "invalid": `writeFile Command: 'writeMode' parameter is invalid: "${command.writeMode}"` } );
    }

    const writeMode = command.writeMode ? command.writeMode : 'create';

    try {
      switch (writeMode) {
        case 'append': { // write will fail if file does NOT exist
          const exists = await messenger.BrokerFileSystem.exists(extensionId, command.fileName);
          if (! exists) {
            this.debug(`writeFileCommand -- writeMode="${writeMode}" - file does not exist: "${command.fileName}"`);
            return ( { "invalid": `writeFile Command: writeMode="${writeMode}" - file does not exist: "${command.fileName}"` } );
          }
          break;
        }  
        case 'create': { // write will fail if file DOES exist
          const exists = await messenger.BrokerFileSystem.exists(extensionId, command.fileName);
          if (exists) {
            this.debug(`writeFileCommand -- writeMode="${writeMode}" - file already exists: "${command.fileName}"`);
            return ( { "invalid": `writeFile Command: writeMode="${writeMode}" - file already exists: "${command.fileName}"` } );
          }
          break;
        }  
      }

      this.debug(`writeFileCommand -- writing data to file "${command.fileName}" with data.length=${command.data.length} for extension "${extensionId}"`);
      const bytesWritten = await messenger.BrokerFileSystem.writeFile(extensionId, command.fileName, command.data, writeMode);
      this.debug(`writeFileCommand -- fileName="${command.fileName}" bytesWritten=${bytesWritten}`);
      return ( { "fileName": command.fileName, "bytesWritten": bytesWritten } );

    } catch (error) {
      this.caught(error, `writeFileCommand -- Caught error while writing file "${command.fileName}":`);
      return ( { "error": `Error Processing writeFile Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async replaceFileCommand(command, extensionId) {
    this.debug(`replaceFileCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName ="${command.fileName }"`);

    if (! command.fileName) {
      this.debug("replaceFileCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "replaceFile Command: no 'fileName' parameter" } );
    } else if ((typeof command.fileName) !== 'string') {
      this.debug("replaceFileCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "replaceFile Command: 'fileName' parameter type must be 'string'" } );
    }

    if (typeof command.data === 'undefined' || command.data == null) {
      this.debug("replaceFileCommand -- Message has no 'data' parameter");
      return ( { "invalid": "replaceFile Command: no 'data' parameter" } );
    } else if ((typeof command.data) !== 'string') {
      this.debug("replaceFileCommand -- Message 'data' parameter type is not 'string'");
      return ( { "invalid": "replaceFile Command: 'data' parameter type must be 'string'" } );
    }

    if (! this.checkValidFileName(command.fileName)) {
      this.debug(`replaceFileCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
      return ( { "invalid": `replaceFile Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
    }

    try {
      this.debug(`replaceFileCommand -- writing data to file "${command.fileName}" with data.length=${command.data.length} for extension "${extensionId}"`);
      const bytesWritten = await messenger.BrokerFileSystem.replaceFile(extensionId, command.fileName, command.data);
      this.debug(`replaceFileCommand -- fileName="${command.fileName}" bytesWritten=${bytesWritten}`);
      return ( { "fileName": command.fileName, "bytesWritten": bytesWritten } );

    } catch (error) {
      this.caught(error, `replaceFileCommand -- Caught error while writing file "${command.fileName}":`);
      return ( { "error": `Error Processing replaceFile Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async appendToFileCommand(command, extensionId) {
    this.debug(`appendToFileCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName ="${command.fileName }"`);

    if (! command.fileName) {
      this.debug("appendToFileCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "appendToFile Command: no 'fileName' parameter" } );
    } else if ((typeof command.fileName) !== 'string') {
      this.debug("appendToFileCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "appendToFile Command: 'fileName' parameter type must be 'string'" } );
    }

    if (typeof command.data === 'undefined' || command.data == null) {
      this.debug("appendToFileCommand -- Message has no 'data' parameter");
      return ( { "invalid": "appendToFile Command: no 'data' parameter" } );
    } else if ((typeof command.data) !== 'string') {
      this.debug("appendToFileCommand -- Message 'data' parameter type is not 'string'");
      return ( { "invalid": "appendToFile Command: 'data' parameter type must be 'string'" } );
    }

    if (! this.checkValidFileName(command.fileName)) {
      this.debug(`appendToFileCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
      return ( { "invalid": `appendToFile Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
    }

    try {
      this.debug(`appendToFileCommand -- writing data to file "${command.fileName}" with data.length=${command.data.length} for extension "${extensionId}"`);
      const bytesWritten = await messenger.BrokerFileSystem.appendToFile(extensionId, command.fileName, command.data);
      this.debug(`appendToFileCommand -- fileName="${command.fileName}" bytesWritten=${bytesWritten}`);
      return ( { "fileName": command.fileName, "bytesWritten": bytesWritten } );

    } catch (error) {
      this.caught(error, `appendToFileCommand -- Caught error while writing file "${command.fileName}":`);
      return ( { "error": `Error Processing appendToFile Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async writeJSONFileCommand(command, extensionId) {
    this.debug(`writeJSONFileCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName ="${command.fileName }"`);

    if (! command.fileName) {
      this.debug("writeJSONFileCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "writeJSONFile Command: no 'fileName' parameter" } );
    } else if ((typeof command.fileName) !== 'string') {
      this.debug("writeJSONFileCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "writeJSONFile Command: 'fileName' parameter type must be 'string'" } );
    }

    if (typeof command.data === 'undefined' || command.data == null) {
      this.debug("writeJSONFileCommand -- Message has no 'data' parameter");
      return ( { "invalid": "writeJSONFile Command: no 'data' parameter" } );
    } else if ((typeof command.data) !== 'string') {
      this.debug("writeJSONFileCommand -- Message 'data' parameter type is not 'string'");
      return ( { "invalid": "writeJSONFile Command: 'data' parameter type must be 'string'" } );
    }

    if (! this.checkValidFileName(command.fileName)) {
      this.debug(`writeJSONFileCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
      return ( { "invalid": `writeJSONFile Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
    }

    if (command.writeMode && ! checkWriteMode(command.writeMode)) {
      this.debug(`writeJSONFileCommand -- Message 'writeMode' parameter is invalid: "${command.writeMode}"`);
      return ( { "invalid": `writeJSONFile Command: 'writeMode' parameter is invalid: "${command.writeMode}"` } );
    }

    const writeMode = command.writeMode ? command.writeMode : 'overwrite';

    try {
      switch (writeMode) {
        // writeJSONFile DOES NOT SUPPORT APPEND MODES!!!
        case 'append':
        case 'appendOrCreate':
          this.debug(`writeJSONFileCommand -- Message 'writeMode' parameter is not supported for JSON: "${command.writeMode}"`);
          return ( { "invalid": `writeJSONFile Command: 'writeMode' parameter is not supported for JSON: "${command.writeMode}"` } );
        case 'create': { // write will fail if file DOES exist
          const exists = await messenger.BrokerFileSystem.exists(extensionId, command.fileName);
          if (exists) {
            this.debug(`writeJSONFileCommand -- writeMode="${writeMode}" - file already exists: "${command.fileName}"`);
            return ( { "invalid": `writeJSONFile Command: writeMode="${writeMode}" - file already exists: "${command.fileName}"` } );
          }
          break;
        }
      }

      this.debug(`writeJSONFileCommand -- writing data to file "${command.fileName}" with data.length=${command.data.length} for extension ${extensionId}"`);
      const bytesWritten = await messenger.BrokerFileSystem.writeJSONFile(extensionId, command.fileName, command.data, writeMode);
      this.debug(`writeJSONFileCommand -- fileName="${command.fileName}" bytesWritten=${bytesWritten}`);
      return ( { "fileName": command.fileName, "bytesWritten": bytesWritten } );

    } catch (error) {
      this.caught(error, `writeJSONFileCommand -- Caught error while writing file "${command.fileName}":`);
      return ( { "error": `Error Processing writeJSONFile Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async writeObjectToJSONFileCommand(command, extensionId) {
    this.debug(`writeObjectToJSONFileCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName ="${command.fileName }"`);

    if (! command.fileName) {
      this.debug("writeObjectToJSONFileCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "writeObjectToJSONFile Command: no 'fileName' parameter" } );
    } else if ((typeof command.fileName) !== 'string') {
      this.debug("writeObjectToJSONFileCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "writeObjectToJSONFile Command: 'fileName' parameter type must be 'string'" } );
    }

    if (typeof command.object === 'undefined' || command.object == null) {
      this.debug("writeObjectToJSONFileCommand -- Message has no 'object' parameter");
      return ( { "invalid": "writeObjectToJSONFile Command: no 'object' parameter" } );
    } else if ((typeof command.object) !== 'object') {
      this.debug("writeObjectToJSONFileCommand -- Message 'object' parameter type is not 'object'");
      return ( { "invalid": "writeObjectToJSONFile Command: 'object' parameter type must be 'object'" } );
    }

    if (! this.checkValidFileName(command.fileName)) {
      this.debug(`writeObjectToJSONFileCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
      return ( { "invalid": `writeObjectToJSONFile Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
    }

    if (command.writeMode && ! checkWriteMode(command.writeMode)) {
      this.debug(`writeObjectToJSONFileCommand -- Message 'writeMode' parameter is invalid: "${command.writeMode}"`);
      return ( { "invalid": `writeObjectToJSONFile Command: 'writeMode' parameter is invalid: "${command.writeMode}"` } );
    }

    const writeMode = command.writeMode ? command.writeMode : 'overwrite';

    try {
      switch (writeMode) {
        // writeJSONFile DOES NOT SUPPORT APPEND MODES!!!
        case 'append':
        case 'appendOrCreate':
          this.debug(`writeObjectToJSONFileCommand -- Message 'writeMode' parameter is not supported for JSON: "${command.writeMode}"`);
          return ( { "invalid": `writeObjectToJSONFile Command: 'writeMode' parameter is not supported for JSON: "${command.writeMode}"` } );
        case 'create': { // write will fail if file DOES exist
          const exists = await messenger.BrokerFileSystem.exists(extensionId, command.fileName);
          if (exists) {
            this.debug(`writeObjectToJSONFileCommand -- writeMode="${writeMode}" - file already exists: "${command.fileName}"`);
            return ( { "invalid": `writeObjectToJSONFile Command: writeMode="${writeMode}" - file already exists: "${command.fileName}"` } );
          }
          break;
        }
      }

      const obj = command.object;
      this.debug(`writeObjectToJSONFileCommand -- writing Object to file "${command.fileName}" with object.length=${Object.keys(obj).length} for extension ${extensionId}"`);
      const bytesWritten = await messenger.BrokerFileSystem.writeObjectToJSONFile(extensionId, command.fileName, obj, writeMode);
      this.debug(`writeObjectToJSONFileCommand -- fileName="${command.fileName}" bytesWritten=${bytesWritten}`);
      return ( { "fileName": command.fileName, "bytesWritten": bytesWritten } );

    } catch (error) {
      this.caught(error, `writeObjectToJSONFileCommand -- Caught error while writing file "${command.fileName}":`);
      return ( { "error": `Error Processing writeObjectToJSONFile Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async readFileCommand(command, extensionId) {
    this.debug(`readFileCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName ="${command.fileName }"`);

    if (! command.fileName) {
      this.debug("readFileCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "readFile Command: no 'fileName' parameter" } );
    } else if ((typeof command.fileName) !== 'string') {
      this.debug("readFileCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "readFile Command: 'fileName' parameter type must be 'string'" } );
    }

    if (! this.checkValidFileName(command.fileName)) {
      this.debug(`readFileCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
      return ( { "invalid": `readFile Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId, command.fileName);
      if (! exists) {
        this.debug(`readFileCommand -- File does not exist: "${command.fileName}"`);
        return ( { "invalid": `readFile Command: File does not exist: "${command.fileName}"` } );
      }

      this.debug(`readFileCommand -- reading from file "${command.fileName}" from the directory for extension "${extensionId}"`);
      const data = await messenger.BrokerFileSystem.readFile(extensionId, command.fileName);
      this.debug(`readFileCommand -- fileName="${ command.fileName}" data.length=${data.length}`);
      return ( { "fileName": command.fileName, "data": data } );

    } catch (error) {
      this.caught(error, `readFileCommand -- Caught error while reading file "${command.fileName}":`);
      return ( { "error": `Error Processing readFile Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async readJSONFileCommand(command, extensionId) {
    this.debug(`readJSONFileCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName ="${command.fileName }"`);

    if (! command.fileName) {
      this.debug("readJSONFileCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "readJSONFile Command: no 'fileName' parameter" } );
    } else if ((typeof command.fileName) !== 'string') {
      this.debug("readJSONFileCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "readJSONFile Command: 'fileName' parameter type must be 'string'" } );
    }

    if (! this.checkValidFileName(command.fileName)) {
      this.debug(`readJSONFileCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
      return ( { "invalid": `readJSONFile Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId, command.fileName);
      if (! exists) {
        this.debug(`readJSONFileCommand -- File does not exist: "${command.fileName}"`);
        return ( { "invalid": `readJSONFile Command: File does not exist: "${command.fileName}"` } );
      }

      this.debug(`readJSONFileCommand -- reading from file "${command.fileName}" from the directory for extension "${extensionId}"`);
      const data = await messenger.BrokerFileSystem.readJSONFile(extensionId, command.fileName);
      this.debug(`readJSONFileCommand -- fileName="${ command.fileName}" data.length=${data.length}`);

      return ( { "fileName": command.fileName, "data": data } );

    } catch (error) {
      this.caught(error, `readJSONFileCommand -- Caught error while reading file "${command.fileName}":`);
      return ( { "error": `Error Processing readJSONFile Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async readObjectFromJSONFileCommand(command, extensionId) {
    this.debug(`readObjectFromJSONFileCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName ="${command.fileName }"`);

    if (! command.fileName) {
      this.debug("readObjectFromJSONFileCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "readObjectFromJSONFile Command: no 'fileName' parameter" } );
    } else if ((typeof command.fileName) !== 'string') {
      this.debug("readObjectFromJSONFileCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "readObjectFromJSONFile Command: 'fileName' parameter type must be 'string'" } );
    }

    if (! this.checkValidFileName(command.fileName)) {
      this.debug(`readObjectFromJSONFileCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
      return ( { "invalid": `readObjectFromJSONFile Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId, command.fileName);
      if (! exists) {
        this.debug(`readObjectFromJSONFileCommand -- File does not exist: "${command.fileName}"`);
        return ( { "invalid": `readObjectFromJSONFile Command: File does not exist: "${command.fileName}"` } );
      }

      this.debug(`readObjectFromJSONFileCommand -- reading from file "${command.fileName}" from the directory for extension "${extensionId}"`);
      const obj = await messenger.BrokerFileSystem.readObjectFromJSONFile(extensionId, command.fileName);
      this.debug(`readObjectFromJSONFileCommand -- filename="${command.fileName}" (typeof obj)='${(typeof obj)}'`);
      return ( { "fileName": command.fileName, "object": obj } );

    } catch (error) {
      this.caught(error, `readObjectFromJSONFileCommand -- Caught error while reading file "${command.fileName}":`);
      return ( { "error": `Error Processing readObjectFromJSONFile Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async getFileInfoCommand(command, extensionId) {
    this.debug(`getFileInfoCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName="${command.fileName}"`);

    if (command.fileName) { // fileName is optional
      if ((typeof command.fileName) !== 'string') {
        this.debug("getFileInfoCommand -- Message 'fileName' parameter type is not 'string'");
        return ( { "invalid": "getFileInfo Command: 'fileName' parameter type must be 'string'" } );
      }

      if (! this.checkValidFileName(command.fileName)) {
        this.debug(`getFileInfoCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
        return ( { "invalid": `getFileInfo Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
      }
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId, command.fileName);
      if (! exists) {
        if (command.fileName) { // fileName is optional
          this.debug(`getFileInfoCommand -- File does not exist: "${command.fileName}"`);
          return ( { "invalid": `getFileInfo Command: File does not exist: "${command.fileName}"` } );
        }

        this.debug(`getFileInfoCommand -- File does not exist: "${extensionId}"`);
        return ( { "invalid": `getFileInfo Command: File does not exist: "${extensionId}"` } );
      }

      this.debug(`getFileInfoCommand -- getting File Info for file "${command.fileName}" for extension "${extensionId}"`);
      const fileInfo = await messenger.BrokerFileSystem.getFileInfo(extensionId, command.fileName); // returns null if file does not exist

      if (! fileInfo) {
        if (command.fileName) { // fileName is optional
          this.debug(`getFileInfoCommand -- File does not exist - No FileInfo for file "${command.fileName}" for extension "${extensionId}"`);
          // MABXXX Hmmm... should we return this, just return undefined/null, or something else? We *did* test for existence above...
          return ( { "error": `File does not exist: "${command.fileName}"` } ); // MABXXX actually, unable to get FileInfo, no?
        }

        this.debug(`getFileInfoCommand -- File does not exist - No FileInfo for file "${extensionId}"`);
        // MABXXX Hmmm... should we return this, just return undefined/null, or something else? We *did* test for existence above...
        return ( { "error": `File does not exist: "${extensionId}"` } ); // MABXXX actually, unable to get FileInfo, no?
      }

      if (command.fileName) { // fileName is optional
        return ( { "fileName": command.fileName, "fileInfo": fileInfo } );
      }

      return ( { "fileName": extensionId, "fileInfo": fileInfo } );

    } catch (error) {
      if (command.fileName) { // fileName is optional
        this.caught(error, `getFileInfoCommand -- Caught error while getting File Info for file "${command.fileName}":`);
      } else {
        this.caught(error, `getFileInfoCommand -- Caught error while getting File Info for file "${extensionId}":`);
      }
      return ( { "error": `Error Processing getFileInfo Command: ${error.message}`, "code": "500" } );
    }

    return; // undefined .. maybe "invalid" instead???
  }



  async renameFileCommand(command, extensionId) {
    this.debug(`renameFileCommand ~~~~~~~~~~~~~~~~~~~~ command.fromFileName="${command.fromFileName}" command.toFileName="${command.toFileName}" command.overwrite=${command.overwrite}`);

    if ((typeof command.fromFileName) !== 'string') {
      this.debug("renameFileCommand -- Message 'fromFileName' parameter type is not 'string'");
      return ( { "invalid": "renameFile Command: 'fromFileName' parameter type must be 'string'" } );
    }

    if (! this.checkValidFileName(command.fromFileName)) {
      this.debug(`renameFileCommand -- Message 'fromFileName' parameter is invalid: "${command.fromFileName}"`);
      return ( { "invalid": `renameFile Command: 'fromFileName' parameter is invalid: "${command.fromFileName}"` } );
    }

    if ((typeof command.toFileName) !== 'string') {
      this.debug("renameFileCommand -- Message 'toFileName' parameter type is not 'string'");
      return ( { "invalid": "renameFile Command: 'toFileName' parameter type must be 'string'" } );
    }

    if (! this.checkValidFileName(command.toFileName)) {
      this.debug(`renameFileCommand -- Message 'toFileName' parameter is invalid: "${command.toFileName}"`);
      return ( { "invalid": `renameFile Command: 'toFileName' parameter is invalid: "${command.toFileName}"` } );
    }

    if (command.overwrite !== null && (typeof command.overwrite) !== 'undefined' && (typeof command.overwrite) !== 'boolean' ) { // optional
      this.debug("renameFileCommand -- Message 'overwrite' parameter type is not 'boolean'");
      return ( { "invalid": "renameFile Command: 'overwrite' parameter type must be 'boolean'" } );
    }

    try {
      this.debug(`renameFileCommand -- Checking if From file exists: "${command.fromFileName}" for extension "${extensionId}"`);
      const fromFileExists = await messenger.BrokerFileSystem.exists(extensionId, command.fromFileName);
      if (! fromFileExists) {
        this.debug(`renameFileCommand -- From File does not exist: "${command.fromFileName}"`);
        return ( { "invalid": `renameFile Command: From File does not exist: "${command.fromFileName}"` } );
      }

      this.debug(`renameFileCommand -- Checking if From file is a Regular File: "${command.fromFileName}" for extension "${extensionId}"`);
      const isRegularFile = await messenger.BrokerFileSystem.isRegularFile(extensionId, command.fromFileName);
      if (! isRegularFile) {
        this.debug(`renameFileCommand -- From File is not a Regular File: "${command.fromFileName}" for extension "${extensionId}"`);
        return ( { "invalid": `From File is not a Regular File: "${command.fromFileName}"` } );
      }
    } catch (error) {
      this.caught(error, `renameFileCommand -- Caught error getting info for From file "${command.fromFileName}":`);
      return ( { "error": `Error Processing renameFile Command: ${error.message}`, "code": "500" } );
    }

    var toFileOverwrite = false;
    if (typeof command.overwrite !== 'undefined') { // optional, schema.json makes sure it's boolean
      toFileOverwrite = command.overwrite;
    }
    this.debug(`renameFileCommand -- (typeof command.overwrite)='${(typeof command.overwrite)}' command.overwrite=${command.overwrite} toFileOverwrite=${toFileOverwrite}`);

    if (! toFileOverwrite) {
      try {
        this.debug(`renameFileCommand -- Checking if To file exists: "${command.toFileName}" for extension "${extensionId}"`);
        const toFileExists = await messenger.BrokerFileSystem.exists(extensionId, command.toFileName);
        if (toFileExists) {
          this.debug(`renameFileCommand -- Rename to File already exists: "${command.toFileName}"`);
          return ( { "invalid": `renameFile Command: Rename to File already exists: "${command.toFileName}"` } );
        }
      } catch (error) {
        this.caught(error, `renameFileCommand -- Caught error getting info for To file "${command.toFileName}":`);
        return ( { "error": `Error Processing renameFile Command: ${error.message}`, "code": "500" } );
      }
    }

    try {
      const renamed = await messenger.BrokerFileSystem.renameFile(extensionId, command.fromFileName, command.toFileName, command.overwrite);
      return ( { "fromFileName": command.fromFileName, "toFileName": command.toFileName, 'renamed': renamed } );
    } catch (error) {
      this.caught(error, `renameFileCommand -- Caught error renaming file "${command.fromFileName}" to "${command.toFileName}":`);
      return ( { "error": `Error Processing renameFile Command: ${error.message}`, "code": "500" } );
    }

    return; // undefined .. maybe "invalid" instead???
  }



  async deleteFileCommand(command, extensionId) {
    this.debug(`deleteFileCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName="${command.fileName}"`);

    if (! command.fileName) {
      this.debug("deleteFileCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "deleteFile Command: no 'fileName' parameter" } );
    }
    if ((typeof command.fileName) !== 'string') {
      this.debug("deleteFileCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "deleteFile Command: 'fileName' parameter type must be 'string'" } );
    }
    if (! this.checkValidFileName(command.fileName)) {
      this.debug(`deleteFileCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
      return ( { "invalid": `deleteFile Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId, command.fileName);
      if (! exists) {
        this.debug(`deleteFileCommand -- File does not exist: "${command.fileName}"`);
        return ( { "invalid": `deleteFile Command: File does not exist: "${command.fileName}"` } );
      }

      const isRegularFile = await messenger.BrokerFileSystem.isRegularFile(extensionId, command.fileName);
      if (! isRegularFile) {
        this.debug(`deleteFileCommand -- File is not a Regular File: "${command.fileName}"`);
        return ( { "invalid": `deleteFile Command: File is not a Regular File: "${command.fileName}"` } );
      }

      this.debug(`deleteFileCommand -- deleting file "${command.fileName}" for extension "${extensionId}"`);
      const deleted = await messenger.BrokerFileSystem.deleteFile(extensionId, command.fileName);
      this.debug(`deleteFileCommand -- deleted=${deleted}`);
      return ( { "fileName": command.fileName, "deleted": deleted } );

    } catch (error) {
      this.caught(error, `deleteFileCommand -- Caught error while deleting file "${command.fileName}":`);
      return ( { "error": `Error Processing deleteFile Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async deleteDirectoryCommand(command, extensionId) {
    this.debug(`deleteDirectoryCommand ~~~~~~~~~~~~~~~~~~~~ command.directoryName="${command.directoryName}" recursive=${command.recursive}`);

    if (command.directoryName) { // directoryName is optional
      if ((typeof command.directoryName) !== 'string') {
        this.debug("deleteDirectory -- Message 'directoryName' parameter type is not 'string'");
        return ( { "invalid": "deleteDirectory Command: 'directoryName' parameter type must be 'string'" } );
      }

      if (! this.checkValidDirName(command.directoryName)) {
        this.debug(`deleteDirectoryCommand -- Message 'directoryName' parameter is invalid: "${command.directoryName}"`);
        return ( { "invalid": `deleteDirectory Command: 'directoryName' parameter is invalid: "${command.directoryName}"` } );
      }
    }

    var recursive = false;
    if ((typeof command.recursive) === 'boolean') {
      recursive = command.recursive;
    } else if ((typeof command.recursive) !== 'undefined') {
      this.debug(`deleteDirectoryCommand -- Message 'recursive' parameter type is not 'boolean'. It is '${typeof command.recursive}'`);
      return ( { "invalid": `deleteDirectory Command: 'recursive' parameter must be type 'boolean'. It is '${typeof command.recursive}'`  } );
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId, command.directoryName);
      if (! exists) {
        if (command.directoryName) { // directoryName is optional
          this.debug(`deleteDirectoryCommand -- Directory does not exist: "${command.directoryName}"`);
          return ( { "invalid": `deleteDirectory Command: Directory does not exist: "${command.directoryName}"` } );
        }

        this.debug(`deleteDirectoryCommand -- Directory does not exist: "${extensionId}"`);
        return ( { "invalid": `deleteDirectory Command: Directory does not exist: "${extensionId}"` } );
      }

      const isDirectory = await messenger.BrokerFileSystem.isDirectory(extensionId, command.directoryName);
      if (! isDirectory) {
        if (command.directoryName) { // directoryName is optional
          this.debug(`deleteDirectoryCommand -- File is not a Directory: "${command.directoryName}"`);
          return ( { "invalid": `deleteDirectory Command: File is not a Directory: "${command.directoryName}"` } );
        }

        this.debug(`deleteDirectoryCommand -- File is not a Directory: "${extensionId}"`);
        return ( { "invalid": `deleteDirectory Command: File is not a Directory: "${extensionId}"` } );
      }

      if (! recursive) {
        const hasFiles = await messenger.BrokerFileSystem.hasFiles(extensionId, command.directoryName);
        if (hasFiles) {
          if (command.directoryName) { // directoryName is optional
            this.debug(`deleteDirectoryCommand -- Directory has files and recursive=false: "${command.directoryName}"`);
            return ( { "invalid": `deleteDirectory Command: Directory has files and recursive=false: "${command.directoryName}"` } );
          }

          this.debug(`deleteDirectoryCommand -- Directory has files and recursive=false: "${extensionId}"`);
          return ( { "invalid": `deleteDirectory Command: Directory has files and recursive=false: "${extensionId}"` } );
        }
      }

      this.debug(`deleteDirectoryCommand -- deleting directory "${command.directoryName}" for extension "${extensionId}"`);
      const deleted = await messenger.BrokerFileSystem.deleteDirectory(extensionId, command.directoryName, recursive);
      if (command.directoryName) { // directoryName is optional
        this.debug(`deleteDirectoryCommand -- directoryName="${command.directoryName}" deleted=${deleted}`);
        return ( { "directoryName": command.directoryName, "recursive": recursive, "deleted": deleted } );
      }

      this.debug(`deleteDirectoryCommand -- directoryName="${extensionId}" deleted=${deleted}`);
      return ( { "directoryName": extensionId, "recursive": recursive, "deleted": deleted } );

    } catch (error) {
      if (command.directoryName) { // directoryName is optional
        this.caught(error, `deleteDirectoryCommand -- Caught error while deleting directory "${command.directoryName}":`);
      } else {
        this.caught(error, `deleteDirectoryCommand -- Caught error while deleting directory "${extensionId}":`);
      }
      return ( { "error": `Error Processing deleteDirectory Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async makeDirectoryCommand(command, extensionId) {
    this.debug("makeDirectoryCommand --");

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId);
      if (exists) {
        this.debug(`makeDirectoryCommand -- File or Directory already exists: "${extensionId}"`);
        return ( { "invalid": `makeDirectory Command: File or Directory already exists: "${extensionId}"` } );
      }
    } catch (error) {
      this.caught(error, `makeDirectoryCommand -- Caught error while checking for existing file or directory "${extensionId}":`);
      return ( { "error": `Error Processing makeDirectory Command: ${error.message}`, "code": "500" } );
    }

    try {
      const created = await messenger.BrokerFileSystem.makeDirectory(extensionId);
      this.debug(`makeDirectoryCommand -- directoryName="${extensionId}" created=${created}`); // notice that directoryName is (*ONLY*) the extensionId - NO SUB-DIRS
      return ( { "directoryName": extensionId, "created": created } );                         // notice that directoryName is (*ONLY*) the extensionId - NO SUB-DIRS

    } catch (error) {
      this.caught(error, `makeDirectoryCommand -- Caught error while creating directory "${extensionId}":`);
      return ( { "error": `Error Processing makeDirectory Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async listFilesCommand(command, extensionId) {
    this.debug(`listFilesCommand ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ matchGLOB="${command.matchGLOB}"`);

    if (command.matchGLOB) {
      if ((typeof command.matchGLOB) !== 'string') {
        this.debug("listFiles -- Message 'matchGLOB' parameter type is not 'string'");
        return ( { "invalid": "listFiles Command: 'matchGLOB' parameter type must be 'string'" } );
      }
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId);
      if (! exists) {
        this.debug(`hasFilesCommand -- Directory does not exist: "${extensionId}"`);
        return ( { "invalid": `listFiles Command: Directory does not exist: "${extensionId}"` } );
      }

      const isDirectory = await messenger.BrokerFileSystem.isDirectory(extensionId);
      if (! isDirectory) {
        this.debug(`hasFilesCommand -- File is not a Directory: "${extensionId}"`);
        return ( { "invalid": `listFiles Command: File is not a Directory: "${extensionId}"` } );
      }
    } catch (error) {
      this.caught(error, `hasFilesCommand -- Caught error while checking if File "${extensionId}" exists and is a Directory:`);
      return ( { "error": `Error Processing listFiles Command: ${error.message}`, "code": "500" } );
    }

    try {
      this.debug(`listFilesCommand -- getting list of files for extension "${extensionId}"`);
      const fileNames = await messenger.BrokerFileSystem.listFiles(extensionId, command.matchGLOB);
      this.debug(`listFilesCommand -- fileNames.length=${fileNames.length}`);
      return ( { "fileNames": fileNames, "length": fileNames.length } );

    } catch (error) {
      this.caught(error, `listFilesCommand -- Caught error while listing files for extension "${extensionId}":`);
      return ( { "error": `Error Processing listFiles Command: ${error.message}`, "code": "500" } );
    }
  }



  async listFileInfoCommand(command, extensionId) {
    this.debug(`listFileInfoCommand ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ matchGLOB="${command.matchGLOB}"`);

    if (command.matchGLOB) {
      if ((typeof command.matchGLOB) !== 'string') {
        this.debug("listFileInfo -- Message 'matchGLOB' parameter type is not 'string'");
        return ( { "invalid": "listFileInfo Command: 'matchGLOB' parameter type must be 'string'" } );
      }
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId);
      if (! exists) {
        this.debug(`hasFilesCommand -- Directory does not exist: "${extensionId}"`);
        return ( { "invalid": `listFileInfo Command: Directory does not exist: "${extensionId}"` } );
      }

      const isDirectory = await messenger.BrokerFileSystem.isDirectory(extensionId);
      if (! isDirectory) {
        this.debug(`hasFilesCommand -- File is not a Directory: "${extensionId}"`);
        return ( { "invalid": `listFileInfo Command: File is not a Directory: "${extensionId}"` } );
      }
    } catch (error) {
      this.caught(error, `hasFilesCommand -- Caught error while checking if File "${extensionId}" exists and is a Directory:`);
      return ( { "error": `Error Processing listFileInfo Command: ${error.message}`, "code": "500" } );
    }

    try {
      this.debug(`listFileInfoCommand -- getting list of files for extension "${extensionId}"`);
      const fileInfo = await messenger.BrokerFileSystem.listFileInfo(extensionId, command.matchGLOB);
      this.debug(`listFileInfoCommand -- fileInfo.length=${fileInfo.length}`);
      return ( { "fileInfo": fileInfo, "length": fileInfo.length } );

    } catch (error) {
      this.caught(error, `listFileInfoCommand -- Caught error while listing files for extension "${extensionId}":`);
      return ( { "error": `Error Processing listFileInfo Command: ${error.message}`, "code": "500" } );
    }
  }



  async listCommand(command, extensionId) {
    this.debug(`list ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ matchGLOB="${command.matchGLOB}"`);

    if (command.matchGLOB) {
      if ((typeof command.matchGLOB) !== 'string') {
        this.debug("list -- Message 'matchGLOB' parameter type is not 'string'");
        return ( { "invalid": "list Command: 'matchGLOB' parameter type must be 'string'" } );
      }
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId);
      if (! exists) {
        this.debug(`hasFilesCommand -- Directory does not exist: "${extensionId}"`);
        return ( { "invalid": `list Command: Directory does not exist: "${extensionId}"` } );
      }

      const isDirectory = await messenger.BrokerFileSystem.isDirectory(extensionId);
      if (! isDirectory) {
        this.debug(`hasFilesCommand -- File is not a Directory: "${extensionId}"`);
        return ( { "invalid": `list Command: File is not a Directory: "${extensionId}"` } );
      }
    } catch (error) {
      this.caught(error, `hasFilesCommand -- Caught error while checking if File "${extensionId}" exists and is a Directory:`);
      return ( { "error": `Error Processing list Command: ${error.message}`, "code": "500" } );
    }

    try {
      this.debug(`list -- getting list of items for extension "${extensionId}"`);
      const fileNames = await messenger.BrokerFileSystem.list(extensionId, command.matchGLOB);
      this.debug(`list -- fileNames.length=${fileNames.length}`);
      return ( { "fileNames": fileNames, "length": fileNames.length } );

    } catch (error) {
      this.caught(error, `list -- Caught error while listing items for extension "${extensionId}":`);
      return ( { "error": `Error Processing list Command: ${error.message}`, "code": "500" } );
    }
  }



  async listInfoCommand(command, extensionId) {
    this.debug(`listInfo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ matchGLOB="${command.matchGLOB}"`);

    if (command.matchGLOB) {
      if ((typeof command.matchGLOB) !== 'string') {
        this.debug("listInfo -- Message 'matchGLOB' parameter type is not 'string'");
        return ( { "invalid": "listInfo Command: 'matchGLOB' parameter type must be 'string'" } );
      }
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(extensionId);
      if (! exists) {
        this.debug(`hasFilesCommand -- Directory does not exist: "${extensionId}"`);
        return ( { "invalid": `listInfo Command: Directory does not exist: "${extensionId}"` } );
      }

      const isDirectory = await messenger.BrokerFileSystem.isDirectory(extensionId);
      if (! isDirectory) {
        this.debug(`hasFilesCommand -- File is not a Directory: "${extensionId}"`);
        return ( { "invalid": `listInfo Command: File is not a Directory: "${extensionId}"` } );
      }
    } catch (error) {
      this.caught(error, `hasFilesCommand -- Caught error while checking if File "${extensionId}" exists and is a Directory:`);
      return ( { "error": `Error Processing listInfo Command: ${error.message}`, "code": "500" } );
    }

    try {
      this.debug(`listInfo -- getting listInfo of items for extension "${extensionId}"`);
      const fileInfo = await messenger.BrokerFileSystem.listInfo(extensionId, command.matchGLOB);
      this.debug(`listInfo -- fileInfo.length=${fileInfo.length}`);
      return ( { "fileInfo": fileInfo, "length": fileInfo.length } );

    } catch (error) {
      this.caught(error, `listInfo -- Caught error while listing items for extension "${extensionId}":`);
      return ( { "error": `Error Processing listInfo Command: ${error.message}`, "code": "500" } );
    }
  }



  async getFullPathNameCommand(command, extensionId) {
    this.debug(`getFullPathNameCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName="${command.fileName}"`);

    if (command.fileName) { // fileName is optional
      if ((typeof command.fileName) !== 'string') {
        this.debug("getFullPathNameCommand -- Message 'fileName' parameter type is not 'string'");
        return ( { "invalid": "getFullPathName Command: 'fileName' parameter type must be 'string'" } );
      }

      if (! this.checkValidFileName(command.fileName)) {
        this.debug(`getFullPathNameCommand -- Message 'fileName' parameter is invalid: "${command.fileName}"`);
        return ( { "invalid": `getFullPathName Command: 'fileName' parameter is invalid: "${command.fileName}"` } );
      }
    }

    try {
      this.debug(`getFullPathNameCommand -- getting full pathname for file "${command.fileName}" for extension "${extensionId}"`);
      const fullPathName = await messenger.BrokerFileSystem.getFullPathName(extensionId, command.fileName);
      if (command.fileName) { // fileName is optional
        this.debug(`getFullPathNameCommand -- fileName="${command.fileName}", fullPathName="${fullPathName}"`);
        return ( { "fileName": command.fileName, "fullPathName": fullPathName } );
      }

      this.debug(`getFullPathNameCommand -- fileName="${extensionId}", fullPathName="${fullPathName}"`);
      return ( { "fileName": extensionId, "fullPathName": fullPathName } );

    } catch (error) {
      if (command.fileName) { // fileName is optional
        this.caught(error, `getFullPathNameCommand -- Caught error while getting full pathname for file "${command.fileName}":`);
      } else {
        this.caught(error, `getFullPathNameCommand -- Caught error while getting full pathname for file "${extensionId}":`);
      }
      return ( { "error": `Error Processing getFullPathName Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async isValidFileNameCommand(command, extensionId) {
    this.debug(`isValidFileNameCommand ~~~~~~~~~~~~~~~~~~~~ command.fileName="${command.fileName}"`);

    if (! command.fileName) {
      this.debug("isValidFileNameCommand -- Message has no 'fileName' parameter");
      return ( { "invalid": "isValidFileName Command: no 'fileName' parameter" } );
    } else if ((typeof command.fileName) !== 'string') {
      this.debug("isValidFileNameCommand -- Message 'fileName' parameter type is not 'string'");
      return ( { "invalid": "isValidFileName Command: 'fileName' parameter type must be 'string'" } );
    }

    try {
      this.debug(`isValidFileNameCommand -- checking for valid fileName for file "${command.fileName}"`);
      const valid = await messenger.BrokerFileSystem.isValidFileName(command.fileName);
      this.debug(`isValidFileNameCommand -- valid=${valid}`);
      return ( { "fileName": command.fileName, "valid": valid } );

    } catch (error) {
      this.caught(error, `isValidFileNameCommand -- Caught error while checking for valid fileName for file "${command.fileName}":`);
      return ( { "error": `Error Processing isValidFileName Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async isValidDirectoryNameCommand(command, extensionId) {
    this.debug(`isValidDirectoryNameCommand ~~~~~~~~~~~~~~~~~~~~ command.directoryName="${command.directoryName}"`);

    if (! command.directoryName) {
      this.debug("isValidDirectoryNameCommand -- Message has no 'directoryName' parameter");
      return ( { "invalid": "isValidDirectoryName Command: no 'directoryName' parameter" } );
    } else if ((typeof command.directoryName) !== 'string') {
      this.debug("isValidDirectoryNameCommand -- Message 'directoryName' parameter type is not 'string'");
      return ( { "invalid": "isValidDirectoryName Command: 'directoryName' parameter type must be 'string'" } );
    }

    try {
      this.debug(`isValidDirectoryNameCommand -- checking for valid directoryName for directory "${command.directoryName}"`);
      const valid = await messenger.BrokerFileSystem.isValidDirectoryName(command.directoryName);
      this.debug(`isValidDirectoryNameCommand -- valid=${valid}`);
      return ( { "directoryName": command.directoryName, "valid": valid } );

    } catch (error) {
      this.caught(error, `isValidDirectoryNameCommand -- Caught error while checking for valid directoryName for directory "${command.directoryName}":`);
      return ( { "error": `Error Processing isValidDirectoryName Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async getFileSystemPathNameCommand(command, extensionId) {
    this.debug("getFileSystemPathNameCommand ~~~~~~~~~~~~~~~~~~~~");

    try {
      this.debug("getFileSystemPathNameCommand -- getting full pathName for FileSystem");
      const pathName = await messenger.BrokerFileSystem.getFileSystemPathName();
      this.debug(`getFileSystemPathNameCommand -- pathName="${pathName}"`);
      return ( { "pathName": pathName } );

    } catch (error) {
      this.caught(error, "getFileSystemPathNameCommand -- Caught error while getting full pathName for FileSystem:");
      return ( { "error": `Error Processing getFileSystemPathName Command: ${error.message}`, "code": "500" } );
    }

    return false;
  }



  async unknownCommand(command, extensionId) {
    this.debug(`unknownCommand ~~~~~~~~~~~~~~~~~~~~ command.command="${command.command}"`);

    if (! command.command) {
      this.error("unknownCommand -- Message has no 'command' parameter");
      return ( { "error": "unknownCommand: Missing 'command' parameter", "code":  "400" });
    }

    this.error(`unknownCommand -- Message has an Invalid Command parameter: "${command.command}"`);
    return ( { "error": `unknownCommand: Invalid 'command' Parameter: "${command.command}"`, "code":  "404" } );
  }



  // Add every key/value pair in command to toObject for recording into a log file, but...
  // - if value is a String, limit to 25 chars,
  //   otherwise use (key + ":string.length") as the key and the string length as the value
  // - if value is an Array, use (key + ":array") as the key and format the elements, but limit to 5,
  //   otherwise use (key + ":array.length") as the key and the array length as the value
  // - if value is an Object, use (key + ":object.entries") as the key and format the entries, but limit to 5,
  //   otherwise use (key + ":object.entries.length") as the key and object.entries.length as the value
  addCommandToObject(command, toObject) {
    // why for the love of puppies is (typeof null) === 'object'???
    if (command == null || toObject == null || typeof command !== 'object' || typeof toObject !== 'object') {
      // MABXXX
    } else {
      for (const [key, value] of Object.entries(command)) {
        if (key === 'data' && typeof value === 'string') {
          // if data string value is "short" (<=25) we put value
          if (value.length <= 25) {
            toObject[key] = value;
          } else {
            toObject[`${key}:string.length`] = value.length; // length because data could be huge!
          }
        } else if (value != null && typeof value === 'object') {
          if (Array.isArray(value)) { // no commands currently take arrays as parameters, but wth?
            // if array is "short" (<=5) we put elements, otherwise we put length
            if (value.length <= 5) {
              var valueList = '';
              for (var i=0; i<5; ++i) {
                const v = value[i]; // doesn't work if v is object
                if (i > 0) valueList += ", ";
                if (typeof v === 'string') {
                  valueList += "[" + i + "]='" + v + "'" // what if string is long?;
                } else {
                  valueList += "[" + i + "]=" + v;
                }
              }
              toObject[`${key}:array`] = valueList;
            } else {
              toObject[`${key}:array.length`] = value.length;
            }
          } else {
            // if entries is "short" (<=5) we put entries, otherwise we put length
            const entries = Object.entries(value);
            if (entries.length > 0 && entries.length <= 5) {
              var valueList = '';
              var i = 0;
              for (const [k, v] of entries) { // doesn't work if v is object
                if (++i > 1) valueList += ", ";
                if (typeof v === 'string') {
                  valueList += "'" + k + "': '" + v + "'"; // what if string is long?
                } else {
                  valueList += "'" + k + "': " + v;
                }
              }
              toObject[`${key}:object.entries`] = valueList;
            } else {
              toObject[`${key}:object.entries.length`] = entries.length;
            }
          }
        } else if (typeof value === 'string') {
          // if value is "short" (<=25) we put value
          if (value.length <= 25) {
            toObject[key] = value;
          } else {
            toObject[`${key}:string.length`] = value.length; // length because data could be huge!
          }
        } else {
          toObject[key] = value;
        }
      }
    }
  }



  // Add every key/value pair in command to A string and return it, but
  // - if value is a String, limit to 25 chars,
  //   otherwise use ("string.length=" + length) as the value
  // - if value is an Array, format elements, but limit to 5,
  //   otherwise use ("array.length=" + length) as the value
  // - if value is an Object, format entries, but limit to 5,
  //   otherwise use ("object.entries.length=" + object.entries.length) as the value
  formatParameters(command) {
    this.debug(`formatParameters -- (typeof command): '${typeof command}'`);

    if (typeof command !== 'object') {
      this.error(`formatParameters -- (typeof command) is not 'object': '${typeof command}'`);
      this.debug(`formatParameters -- returning: '(command unavailable)'`);
      return "(command unavailable)";
    }

    var formatted = '';
    var idx = 0;
    for (const [key, value] of Object.entries(command)) {
      if (key === 'command') continue;

      if (++idx > 1) formatted += ', ';

      if (key === 'data' && typeof value === 'string') {
        // if data string value is "short" (<=25) we put value
        if (value.length <= 25) {
          formatted += key + '="' + value + '"';
        } else {
          formatted += key + ': string';
        }
      } else if (value != null && typeof value === 'object') {
        if (Array.isArray(value)) { // no commands currently take arrays as parameters, but wth?
          // if array is "short" (<=5) we put elements, otherwise we put length
          if (value.length <= 5) {
            var valueList = '';
            for (var i=0; i<5; ++i) {
              const v = value[i];
              if (i > 0) valueList += ", ";
              if (typeof v === 'string') {
                if (v.length <= 25) {
                  valueList += "[" + i + "]='" + v + "'";
                } else {
                  valueList += "[" + i + "]: string";
                }  
              } else if (typeof v === 'object') {
                valueList += "[" + i + "]: object";
              } else {
                valueList += "[" + i + "]=" + v;
              }
            }
            formatted += key + ' array: ' + valueList;
          } else {
            formatted += key + ' array.length=' + value.length;
            
          }
        } else {
          // if entries is "short" (<=5) we put entries, otherwise we put length
          const entries = Object.entries(value);
          if (entries.length > 0 && entries.length <= 5) {
            var valueList = '';
            var i = 0;
            for (const [k, v] of entries) {
              if (++i > 1) valueList += ", ";
              if (typeof v === 'string') {
                if (v.length <= 25) {
                  valueList += "'" + k + "': '" + v + "'";
                } else {
                  valueList += "'" + k + "': string";
                }
              } else if (typeof v === 'object') {
                valueList += "'" + k + "': object";
              } else {
                valueList += "'" + k + "': " + v;
              }
            }
            formatted += key + ' object.entries: ' + valueList;
          } else {
            formatted += key + ' object.entries.length=' + entries.length;
          }
        }
      } else if (typeof value === 'string') {
        if (value.length <= 25) {
          formatted += key + '="' + value + '"';
        } else {
          formatted += key + ': string';
        }
      } else {
        formatted += key + '=' + value;
      }
    }

    this.debug(`formatParameters -- returning: '${formatted}'`);
    return formatted;
  }



  formatCommandResult(command, result) {
    if (typeof command !== 'object' || typeof result !== 'object') {
      this.error(`formatCommandResult -- Invalid Parameter Types: (typeof command)='${typeof command}' (typeof result)='${typeof result}'`);
      return "(result unavailable)";

    } else {
      if (result.error) {
        return "error: " + result.error;
      }
      if (result.invalid) {
        return "invalid: " + result.invalid;
      }

      switch(command.command) {
        case "access": // this command must be handled where access control is handled, which is in background.js for now
          return "access=" + result.access;
        case "exists":
          return "exists=" + result.exists;
        case "isRegularFile":
          return "isRegularFile=" + result.isRegularFile;
        case "isDirectory":
          return "isDirectory=" + result.isDirectory;
        case "hasFiles":
          return "hasFiles=" + result.hasFiles;
        case "getFileCount":
          return "fileCount=" + result.fileCount;
        case "writeFile":
          return "bytesWritten=" + result.bytesWritten;
        case "replaceFile":
          return "bytesWritten=" + result.bytesWritten;
        case "appendToFile":
          return "bytesWritten=" + result.bytesWritten;
        case "writeJSONFile":
          return "bytesWritten=" + result.bytesWritten;
        case "writeObjectToJSONFile":
          return "bytesWritten=" + result.bytesWritten;
        case "readFile":
          return "length=" + result.data.length;
        case "readJSONFile":
          return "length=" + result.data.length;
        case "readObjectFromJSONFile":
          {
            const value   = result.object;
            const entries = Object.entries(value);
//          if (entries.length > 0 && entries.length <= 5) {
//            var valueList = '';
//            var idx = 0;
//            for (const [k, v] of entries) { // doesn't work if v is object
//              if (++idx > 1) valueList += ", ";
//              if (typeof v === 'string') {
//                valueList += "'" + k + "': '" + v + "'"; // what if string is long?
//              } else {
//                valueList += "'" + k + "': " + v;
//              }
//            }
//            return "object:entries=" + valueList;
//          }
            return "object:entries.length=" + entries.length;

          }
        case "getFileInfo":
          {
            const info = result.fileInfo;
//          return     "FileInfo:"
//                   + ` fileName="${info.fileName}"`
            return      `fileName="${info.fileName}"`
//                   + ` path="${info.path}"`
                     + ` type="${info.type}"`
                     + ` size=${info.size}`
//                   + ` permissions=${info.permissions}`
//                   + ` creationTime="${formatMsToDateTime24HR(info.creationTime)}" (${info.creationTime})`
                     + ` creationTime="${formatMsToDateTime24HR(info.creationTime)}"`
//                   + ` lastAccessed="${formatMsToDateTime24HR(info.lastAccessed)}" (${info.lastAccessed})`
                     + ` lastAccessed="${formatMsToDateTime24HR(info.lastAccessed)}"`
//                   + ` lastModified="${formatMsToDateTime24HR(info.lastModified)}" (${info.lastModified})`;
                     + ` lastModified="${formatMsToDateTime24HR(info.lastModified)}"`;
          }
        case "renameFile":
          return "renamed=" + result.renamed;
        case "deleteFile":
          return "deleted=" + result.deleted;
        case "deleteDirectory":
          return "deleted=" + result.deleted;
        case "makeDirectory":
          return "created=" + result.created;
        case "listFiles":
          return result.fileNames ? "fileNameslength=" + result.fileNames.length : "(NO fileNames)";
        case "listFileInfo":
          return result.fileInfo  ? "fileInfo.length=" + result.fileInfo.length  : "(NO fileInfo)";
        case "list":
          return result.fileNames ? "fileNameslength=" + result.fileNames.length : "(NO fileNames)";
        case "listInfo":
          return result.fileInfo  ? "fileInfo.length=" + result.fileInfo.length  : "(NO fileInfo)";
        case "getFullPathName":
          return "fullPathName=" + result.fullPathName;
        case "isValidFileName":
          return "valid=" + result.valid;
        case "isValidDirectoryName":
          return "valid=" + result.valid;
        case "getFileSystemPathName":
          return "pathName=" + result.pathName;
      }

      return "Unknown Command:" + command.command;
    }
  }




  /* Return true of the given filename is valid, otherwise false
   *
   * filename type must be 'string'
   *
   * ILLEGAL CHARS:
   *
   *   <
   *   >
   *   :
   *   "
   *   /
   *   \
   *   |
   *   ?
   *   *
   *   x00-x1F (control characters)
   *
   * RESERVED NAMES:
   * - con
   * - prn
   * - aux
   * - nul
   * - com0 - com9
   * - lpt0 - lpt9
   * AND FOR DIRECTORIES:
   * - ..
   *
   * NO MORE THAN 64 CHARACTERS
   */
  checkValidFileName(filename) {
    if (typeof filename !== 'string') return false;

    const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
    if (ILLEGAL_CHARS.test(filename)) return false;

    // should this be windows-only???
    const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
    if (RESERVED_NAMES.test(filename)) return false;

    if (filename.length > 64) return false;

    return true;
  }

  checkValidDirName(dirname) {
    if (typeof dirname !== 'string') return false;

    const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
    if (ILLEGAL_CHARS.test(dirname)) return false;

    // should this be windows-only???
    const RESERVED_NAMES = /^(\.\.|con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
    if (RESERVED_NAMES.test(dirname)) return false;

    if (dirname.length > 64) return false;

    return true;
  }

  /* Must be a String with at least one character.
   *
   * ILLEGAL CHARS:
   *
   *   A-Z (must be lower-case)
   *   <
   *   >
   *   :
   *   "
   *   /
   *   \
   *   |
   *   ?
   *   *
   *   x00-x1F (control characters)
   *
   * RESERVED NAMES:
   * - con
   * - prn
   * - aux
   * - nul
   * - com0 - com9
   * - lpt0 - lpt9
   * - ..
   *
   * NO MORE THAN *64* CHARACTERS
   */
  checkValidExtensionId(extensionId) {
    if (typeof extensionId !== 'string' || extensionId.length < 1 || extensionId.length > 64) return false;
    
    const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g; // will be used as part of a directoryName, so no OS-restricted chars
    if (ILLEGAL_CHARS.test(extensionId)) return false;

    // should this be windows-only???
    const RESERVED_NAMES = /^(\.\.|con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
    if (RESERVED_NAMES.test(extensionId)) return false;

    // note: no upper-case
    const LIKE_EMAIL_REGEX = /\A(?=[a-z0-9@.!#$%&'*+/=?^_`{|}~-]{6,254}\z)(?=[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@)[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:(?=[a-z0-9-]{1,63}\.)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?=[a-z0-9-]{1,63}\z)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\z/;

////const ENCLOSED_GUID_REGEX   = /^\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}$/;
////const UNENCLOSED_GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    // note: no upper-case
    const ENCLOSED_GUID_REGEX   = /^\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}$/;
    const UNENCLOSED_GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

    if (! LIKE_EMAIL_REGEX.test(extensionId)) {
      if (extensionId[0] === '{') {
        if (ENCLOSED_GUID_REGEX.test(extensionId)) return true;
      } else {
        if (UNENCLOSED_GUID_REGEX.test(extensionId)) return true;
      }
    }

    return true;
  }




  checkWriteMode(writeMode) {
    if (typeof writeMode !== 'string') return false;

    switch (writeMode) {
      case 'overwrite':
      case 'append':
      case 'appendOrCreate':
      case 'create':
        return true;
    }

    return false;
  }

}
