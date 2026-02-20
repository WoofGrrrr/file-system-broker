import { getExtensionId } from '../utilities.js';

/*
 * This file is provided by the WoofGrrrr GitHub repository at
 * https://github.com/WoofGrrrr/file-system-broker
 *
 * Author: WoofGrrrr
 *
 * Version v0.9.0-beta-1
 *
 * - Functions:
 *   . access
 *   . exists
 *   . isRegulerFile
 *   . isDirectory
 *   . hasFiles
 *   . getFileCount
 *   . writeFile (with optional writeMode, one of 'overwrite', 'replace', 'append', 'appendOrCreate',
 *   . replaceFile (writeFile with writeMode = 'overwrite')
 *   . appendToFile (writeFile with writeMode = 'appendOrCreate')
 *   . writeJSONFile
 *   . writeObjectToJSONFile
 *   . readFile
 *   . readJSONFile
 *   . readObjectFromJSONFile
 *   . getFileInfo
 *   . renameFile
 *   . deleteFile
 *   . deleteDirectory - Can delete ONLY the directory for the calling Extension. (We cannot make sub-direcories and FileNames cannot contain path separator characters.)
 *   . makeDirectory - Can make only the directory for the calling Extension.  Cannot make sub-directories.
 *   . listFiles - with optional fileName match GLOB
 *   . listFileInfo - with optional fileName match GLOB
 *   . list - with optional fileName match GLOB
 *   . listInfo - with optional fileName match GLOB
 *   . getFullPathName
 *   . isValidFileName
 *   . isValidDirectoryName
 *   . getFileSystemPathName
 *   . stats
 *   . fsbListInfo - with optional fileName match GLOB MABXXX MAYBE NOT IN THIS API??? INTERNAL-ONLY COMMAND
 *   . fsbList - MABXXX MAYBE NOT IN THIS API??? INTERNAL-ONLY COMMAND
 *   . fsStats - MABXXX MAYBE NOT IN THIS API??? INTERNAL-ONLY COMMAND
 *
 * ** A fileName may not contain these characters:
 *      < (less than)
 *      > (greater than)
 *      : (colon)
 *      " (double-quote)
 *      / (forward slash)
 *      \ (backward slash)
 *      | (vertical bar)
 *      ? (question mark)
 *      * (asterisk)
 *      x00-x1F (control characters)
 *
 * ** A fileName may not be any of these reserved names:
 *      - con
 *      - prn
 *      - aux
 *      - nul
 *      - com0 - com9
 *      - lpt0 - lpt9
 *    IN ADDITION, THE FOLLOWING DIRECTORY NAMES CANNOT BE USED:
 *      - .. (two dots or periods)
 *
 * ** A fileName may not be longer than 64 characters
 *
 * ** A total filePath may not be longer than 255 characters
 *
 *
 *
 * Version v0.9.0-beta-1
 * - First version
 *
 * Author: WoofGrrrr
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

"use strict";


export class FileSystemBrokerAPI {

  constructor() {
    this.FILE_SYSTEM_BROKER_EXTENSION_ID = "file-system-broker@localmotive.com";

    this.className = this.constructor.name;

    this.LOG       = false;
    this.DEBUG     = false;
  }



  log(...info) {
    if (! this.LOG) return;
    const msg = info.shift();
    console.log(this.className + "#" + msg, ...info);
  }

  logAlways(...info) {
    const msg = info.shift();
    console.log(this.className + "#" + msg, ...info);
  }

  debug(...info) {
    if (! this.DEBUG) return;
    const msg = info.shift();
    console.debug(this.className + "#" + msg, ...info);
  }

  debugAlways(...info) {
    const msg = info.shift();
    console.debug(this.className + "#" + msg, ...info);
  }

  error(...info) {
    // always log errors
    const msg = info.shift();
    console.error(this.className + "#" + msg, ...info);
  }

  caught(e, ...info) {
    // always log exceptions
    const msg = info.shift();
    console.error( this.className + "#" + msg,
                   "\n name:    " + e.name,
                   "\n message: " + e.message,
                   "\n stack:   " + e.stack,
                   ...info
                 );
  }



  async access() {
    return await this.sendFSBrokerCommand( { "command": "access" } );
  }

  async exists(fileName) {
    return await this.sendFSBrokerCommand( { "command": "exists", "fileName": fileName } );
  }

  async isRegularFile(fileName) {
    return this.sendFSBrokerCommand( { "command": "isRegularFile", "fileName": fileName } );
  }

  async isDirectory(directoryName) {
    return await this.sendFSBrokerCommand( { "command": "isDirectory", "directoryName": directoryName } );
  }

  async hasFiles(directoryName) {
    return await this.sendFSBrokerCommand( { "command": "hasFiles", "directoryName": directoryName } );
  }

  async getFileCount(directoryName) {
    return await this.sendFSBrokerCommand( { "command": "getFileCount", "directoryName": directoryName } );
  }

  async readFile(fileName) {
    return await this.sendFSBrokerCommand( { "command": "readFile", "fileName": fileName } );
  }

  async readJSONFile(fileName) {
    return await this.sendFSBrokerCommand( { "command": "readJSONFile", "fileName": fileName } );
  }

  async readObjectFromJSONFile(fileName) {
    return await this.sendFSBrokerCommand( { "command": "readObjectFromJSONFile", "fileName": fileName } );
  }

  async writeFile(fileName, data, writeMode) {
    if (writeMode) {
      return await this.sendFSBrokerCommand( { "command": "writeFile", "fileName": fileName, "data": data , "writeMode": writeMode} );
    } else {
      return await this.sendFSBrokerCommand( { "command": "writeFile", "fileName": fileName, "data": data } );
    }
  }

  async replaceFile(fileName, data) {
    return await this.sendFSBrokerCommand( { "command": "replaceFile", "fileName": fileName, "data": data } );
  }

  async appendToFile(fileName, data) {
    return await this.sendFSBrokerCommand( { "command": "appendToFile", "fileName": fileName, "data": data } );
  }

  async writeJSONFile(fileName, data, writeMode) {
    if (writeMode) {
      return await this.sendFSBrokerCommand( { "command": "writeJSONFile", "fileName": fileName, "data": data , "writeMode": writeMode} );
    } else {
      return await this.sendFSBrokerCommand( { "command": "writeJSONFile", "fileName": fileName, "data": data } );
    }
  }

  async writeObjectToJSONFile(fileName, object, writeMode) {
    if (writeMode) {
      return await this.sendFSBrokerCommand( { "command": "writeObjectToJSONFile", "fileName": fileName, "object": object , "writeMode": writeMode} );
    } else {
      return await this.sendFSBrokerCommand( { "command": "writeObjectToJSONFile", "fileName": fileName, "object": object } );
    }
  }

  async deleteFile(fileName) {
    return await this.sendFSBrokerCommand( { "command": "deleteFile", "fileName": fileName } );
  }

  async deleteDirectory(directoryName, recursive) {
    return await this.sendFSBrokerCommand( { "command": "deleteDirectory", "directoryName": directoryName, "recursive": recursive } );
  }

  async makeDirectory() {
    return await this.sendFSBrokerCommand( { "command": "makeDirectory" } );
  }

  async getFileInfo(fileName) {
    return await this.sendFSBrokerCommand( { "command": "getFileInfo", "fileName": fileName } );
  }

  async renameFile(fromFileName, toFileName, overwrite) {
    if (overwrite == null || typeof overwrite === 'undefined') {
      return await this.sendFSBrokerCommand( { "command": "renameFile", "fromFileName": fromFileName, "toFileName": toFileName } );
    } else {
      return await this.sendFSBrokerCommand( { "command": "renameFile", "fromFileName": fromFileName, "toFileName": toFileName, "overwrite": overwrite } );
    }
  }

  async listFiles(matchGLOB) {
    if (matchGLOB == null || typeof matchGLOB === 'undefined') {
      return await this.sendFSBrokerCommand( { "command": "listFiles" } );
    } else {
      return await this.sendFSBrokerCommand( { "command": "listFiles", "matchGLOB": matchGLOB } )
    }
  }

  async listFileInfo(matchGLOB) {
    if (matchGLOB == null || typeof matchGLOB === 'undefined') {
      return await this.sendFSBrokerCommand( { "command": "listFileInfo" } );
    } else {
      return await this.sendFSBrokerCommand( { "command": "listFileInfo", "matchGLOB": matchGLOB } )
    }
  }

  async list(matchGLOB) {
    if (matchGLOB == null || typeof matchGLOB === 'undefined') {
      return await this.sendFSBrokerCommand( { "command": "list" } );
    } else {
      return await this.sendFSBrokerCommand( { "command": "list", "matchGLOB": matchGLOB } )
    }
  }

  async listInfo(matchGLOB) {
    if (matchGLOB == null || typeof matchGLOB === 'undefined') {
      return await this.sendFSBrokerCommand( { "command": "listInfo" } );
    } else {
      return await this.sendFSBrokerCommand( { "command": "listInfo", "matchGLOB": matchGLOB } )
    }
  }

  async getFullPathName(fileName) {
    return await this.sendFSBrokerCommand( { "command": "getFullPathName", "fileName": fileName } );
  }

  async isValidFileName(fileName) {
    return await this.sendFSBrokerCommand( { "command": "isValidFileName", "fileName": fileName } );
  }

  async isValidDirectoryName(directoryName) {
    return await this.sendFSBrokerCommand( { "command": "isValidDirectoryName", "directoryName": directoryName } );
  }

  async getFileSystemPathName() {
    return await this.sendFSBrokerCommand( { "command": "getFileSystemPathName" } );
  }

  async stats(parameters) {
    var Command;
    if (parameters === null || typeof parameters === 'undefined') {
      Command = { "command": "stats", };
    } else {
      Command = { "command": "stats", "parameters": parameters, };
    }

    return await this.sendFSBrokerCommand(Command);
  }

  async fsbListInfo(parameters) { // MABXXX MAYBE NOT IN THIS API??? INTERNAL-ONLY COMMAND
    if (parameters === null || typeof parameters === 'undefined') {
      return await this.sendFSBrokerCommand( { "command": "fsbListInfo" } );
    } else {
      return await this.sendFSBrokerCommand( { "command": "fsbListInfo", "parameters": parameters, } )
    }
  }

  async fsbList(parameters) { // MABXXX MAYBE NOT IN THIS API??? INTERNAL-ONLY COMMAND
    if (parameters === null || typeof parameters === 'undefined') {
      return await this.sendFSBrokerCommand( { "command": "fsbList" } );
    } else {
      return await this.sendFSBrokerCommand( { "command": "fsbList", "parameters": parameters, } )
    }
  }

  async fsbStats() { // MABXXX MAYBE NOT IN THIS API??? INTERNAL-ONLY COMMAND
    return await this.sendFSBrokerCommand( { "command": "fsbStats" } );
  }

  async fsbDeleteDirectory(directoryName, parameters) { // MABXXX MAYBE NOT IN THIS API??? INTERNAL-ONLY COMMAND
    var Command;
    if (parameters === null || typeof parameters === 'undefined') {
      Command = { "command": "fsbDeleteDirectory", "directoryName": directoryName };
    } else {
      Command = { "command": "fsbDeleteDirectory", "directoryName": directoryName, "parameters": parameters };
    }
    this.debug("\n--------------------> fsbDeleteDirectory Sending Command:\n", Command);
    return await this.sendFSBrokerCommand(Command);
  }



  async sendFSBrokerCommand(command) {
    this.debug(`sendFSBrokerCommand -- sending command command.command="${command.command}" to Extension "${this.FILE_SYSTEM_BROKER_EXTENSION_ID}",\nCOMMAND: `, command);
    let response;
    try {
      const message = { "Command": command };
      response = await messenger.runtime.sendMessage(this.FILE_SYSTEM_BROKER_EXTENSION_ID, message);
    } catch (error) {
      this.caught(error, "sendFSBrokerCommand !!!!! MESSAGE SEND FAILED !!!!!");
      return { "error": `Failed to send Command Message to FileSystemBroker Extension "${this.FILE_SYSTEM_BROKER_EXTENSION_ID}"`,
               "code":  "503"
             };
    }

    if (! response) {
      this.error("sendFSBrokerCommand -- GOT NO RESPONSE!!!", command);
      return { "error": `Failed to get a Command Response from FileSystemBroker Extension "${this.FILE_SYSTEM_BROKER_EXTENSION_ID}"`,
               "code":  "500"
             };
    }

    this.debug("sendFSBrokerCommand -- Got a Response!!!");
    return response;
  }
}
