/*
 * This file is provided by the file-system-broker repository at
 * https://github.com/WoofGrrrr/file-system-broker
 *
 * It is originally based on on a fork of the FileSystem experiment of the
 * webext-support experiments repository at
 * https://github.com/thunderbird/webext-support/tree/master/experiments/FileSystem
 *
 * Author: WoofGrrrr
 *
 * Version v0.9.0-beta-1
 *
 * In addition to the abilities offered by the FileSystem experiement, this code;
 *
 * - Checks for valid fileNames and filePaths**
 *
 * - Adds a few additional checks
 *
 * - New functions and functionality:
 *   . exists
 *   . isRegulerFile
 *   . isDirectory
 *   . hasFiles
 *   . getFileCount
 *   . writeFile now takes an optional writeMode parameter - 'overwrite' (or 'replace',) 'append', 'appendOrCreate', 'create'
 *   . replaceFile (writeFile with writeMode = 'overwrite')
 *   . appendToFile (writeFile with writeMode = 'appendOrCreate')
 *   . writeJSONFIle
 *   . writeObjectToJSONFile
 *   . readJSONFIle
 *   . readObjectFromJSONFIle
 *   . getFileInfo
 *   . deleteFile
 *   . renameFile
 *   . deleteDirectory - Can delete ONLY the directory for the Extension. (Cannot make sub-directtories, and FileNames cannot contain path separator characters.)
 *   . makeDirectory - Can make only the directory for the Extension.  Cannot make sub-directories.
 *   . listFiles - with optional fileName match GLOB
 *   . list - with optional fileName match GLOB
 *   . getFullPathName
 *   . isValidFileName
 *   . isValidDirectoryName
 *   . getFileSystemPathName
 *
 * ** A fileName may not contain these characters:
 *      <
 *      >
 *      :
 *      "
 *      /
 *      \
 *      |
 *      ?
 *      *
 *      x00-x1F (control characters)
 *
 * ** A fileName may not be any of these reserved names:
 *      - con
 *      - prn
 *      - aux
 *      - nul
 *      - com0 - com9
 *      - lpt0 - lpt9
 * ** In addition, a directoryName may not be any of these reserved names:
 *      - ..
 *
 * ** A fileName may not be longer than 64 characters
 *
 * ** A total filePath may not be longer than 255 characters
 * 
 *
 *
 * This repository is a fork of the webext-support repository at
 * https://github.com/thunderbird/webext-support
 *
 * Version 1.3
 * - adjusted to TB128 (no longer loading Services and ExtensionCommon)
 * - use ChromeUtils.importESModule()
 *
 * Version 1.2
 * - adjusted to properly work with TB115 and TB102
 *
 * Version 1.1
 * - adjusted to Thunderbird 115 (Services is now in globalThis)
 *
 * Version 1.0
 * - initial release
 *
 * Author: John Bieling (john@thunderbird.net)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/* global Services, ExtensionCommon */

"use strict";

// Import some things we need.
var { ExtensionUtils } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionUtils.sys.mjs"
);
var { ExtensionError } = ExtensionUtils;

Cu.importGlobalProperties(["IOUtils", "PathUtils"]);

var FileSystemExp  = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {

      FileSystemExp : {

        // returns boolean
        async exists(fileName) {
          if (fileName && ! checkFileName(fileName)) { // fileName is optional
            debug(`exists -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.exists -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`exists -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.exists -- filePath is invalid: "${filePath}"`);
          }

          try {
            debug(`exists -- calling IOUtils.exists - filePath="${filePath}"`);
            const exists = await IOUtils.exists(filePath); // returns Promise<boolean>
            debug(`exists -- filePath="${filePath}" exists=${exists}`);
            return exists;
          } catch (error) {
            caught(error, "exists -- FILE SYSTEM ERROR", `checking existence of File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.exist -- Error checking existence of File "${fileName}" at "${filePath}"`);
          }
        },



        // returns boolean
        async isRegularFile(fileName) {
          if (fileName && ! checkFileName(fileName)) { // fileName is optional
            debug(`isRegularFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.isRegularFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`isRegularFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.isRegularFile -- filePath is invalid: "${filePath}"`);
          }

          let fileInfo;
          try {
            debug(`isRegularFile -- calling IOUtils.exists - filePath="${filePath}"`);
            const exists = await IOUtils.exists(filePath); // returns Promise<boolean>
            if (! exists) return false;

            debug(`isRegularFile -- calling IOUtils.stat - filePath="${filePath}"`);
            fileInfo = await IOUtils.stat(filePath); // returns Promise<FileInfo>

          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            if (error.name !== 'NotFoundError') {
              caught(error, "isRegularFile -- FILE SYSTEM ERROR", `Checking if File "${fileName}" at "${filePath}" is a Regular File`);
              throw new ExtensionError(`FileSystemExp.isRegularFile -- Error checking if File "${fileName}" at "${filePath}" is a Regular File`);
            }
          }
          if (! fileInfo) {
            debug(`isRegularFile --  Unable to get file type for File "${fileName}" at "${filePath}" - is it a Regular File?`);
            throw new ExtensionError(`FileSystemExp.isRegularFile -- Unable to get file type for File "${fileName}" at "${filePath}" - is it a Regular File?`);
          }

          return (fileInfo.type === 'regular'); // enum FileType { "regular", "directory", "other" };
        },



        // returns boolean
        async isDirectory(directoryName) {
          if (directoryName && ! checkDirectoryName(directoryName)) { // directoryName is optional
            debug(`isDirectory -- directoryName is invalid: "${directoryName}"`);
            throw new ExtensionError(`FileSystemExp.isDirectory -- directoryName is invalid: "${directoryName}"`);
          }

          const dirPath = buildPathName(context, directoryName);
          if (! checkFilePath(dirPath)) {
            debug(`isDirectory -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.isDirectory -- dirPath is invalid: "${dirPath}"`);
          }

          let fileInfo;
          try {
            debug(`isDirectory -- calling IOUtils.exists - dirPath="${dirPath}"`);
            const exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
            if (! exists) return false;

            debug(`isDirectory -- calling IOUtils.stat - dirPath="${dirPath}"`);
            fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>

          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            if (error.name !== 'NotFoundError') {
              caught(error, "isDirectory -- FILE SYSTEM ERROR", `checking if File "${directoryName}" at "${dirPath}" is a Directory`);
              throw new ExtensionError(`FileSystemExp.isDirectory -- Error checking if File "${directoryName}" at "${dirPath}" is a Directory`);
            }
          }
          if (! fileInfo) {
            debug(`isDirectory --  Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
            throw new ExtensionError(`FileSystemExp.isDirectory -- Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
          }

          return (fileInfo.type === 'directory'); // enum FileType { "regular", "directory", "other" };
        },



        // returns boolean
        async hasFiles(directoryName) {
          if (directoryName && ! checkDirectoryName(directoryName)) { // directoryName is optional
            debug(`hasFiles -- directoryName is invalid: "${directoryName}"`);
            throw new ExtensionError(`FileSystemExp.hasFiles -- directoryName is invalid: "${directoryName}"`);
          }

          const dirPath = buildPathName(context, directoryName);
          if (! checkFilePath(dirPath)) {
            debug(`hasFiles -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.hasFiles -- dirPath is invalid: "${dirPath}"`);
          }

          let exists;
          try {
            debug(`hasFiles -- calling IOUtils.exists - dirPath="${dirPath}"`);
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "hasFiles -- FILE SYSTEM ERROR", `checking if file "${directoryName}" at "${dirPath}" exists`);
            throw new ExtensionError(`FileSystemExp.hasFiles -- Error checking if file "${directoryName}" at "${dirPath}" exists`);
          }
          if (! exists) {
            throw new ExtensionError(`FileSystemExp.hasFiles -- File "${directoryName}" at "${dirPath}" does not exist`);
          }

          let fileInfo;
          try {
            debug(`hasFiles -- calling IOUtils.stat - dirPath="${dirPath}"`);
            fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>

          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            if (error.name !== 'NotFoundError') {
              caught(error, "hasFiles -- FILE SYSTEM ERROR", `checking if file "${directoryName}" at "${dirPath}" is a Directory`);
              throw new ExtensionError(`FileSystemExp.hasFiles -- Error checking if file "${directoryName}" at "${dirPath}" is a Directory`);
            }
          }
          if (! fileInfo) {
            debug(`hasFiles --  Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
            throw new ExtensionError(`FileSystemExp.hasFiles -- Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
          }

          if (fileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
            throw new ExtensionError(`FileSystemExp.hasFiles -- File "${directoryName}" at "${dirPath}" is not a Directory`);
          }

          try {
            debug(`hasFiles -- calling IOUtils.hasChildren - dirPath="${dirPath}"`);
            const hasChildren = await IOUtils.hasChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<boolean> // NOTE: ignoreAbsent
            debug(`hasFiles -- dirPath="${dirPath}" hasChildren=${hasChildren}`);
            return hasChildren;
          } catch (error) {
            debug(`hasFiles --  Unable to get hasChildren for Directory "${directoryName}" at "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.hasFiles -- Unable to check if Directory "${directoryName}" has files at "${dirPath}"`);
          }
        },



        // returns integer
        async getFileCount(directoryName) {
          if (directoryName && ! checkDirectoryName(directoryName)) { // directoryName is optional
            debug(`getFileCount -- directoryName is invalid: "${directoryName}"`);
            throw new ExtensionError(`FileSystemExp.getFileCount -- directoryName is invalid: "${directoryName}"`);
          }

          const dirPath = buildPathName(context, directoryName);
          if (! checkFilePath(dirPath)) {
            debug(`getFileCount -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.getFileCount -- dirPath is invalid: "${dirPath}"`);
          }

          let exists;
          try {
            debug(`getFileCount -- calling IOUtils.exists - dirPath="${dirPath}"`);
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "getFileCount -- FILE SYSTEM ERROR", `checking if file "${directoryName}" at "${dirPath}" exists`);
            throw new ExtensionError(`FileSystemExp.getFileCount -- Error checking if file "${directoryName}" at "${dirPath}" exists`);
          }
          if (! exists) {
            throw new ExtensionError(`FileSystemExp.getFileCount -- File "${directoryName}" at "${dirPath}" does not exist`);
          }

          let fileInfo;
          try {
            debug(`getFileCount -- calling IOUtils.stat - dirPath="${dirPath}"`);
            fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            if (error.name !== 'NotFoundError') {
              caught(error, "getFileCount -- FILE SYSTEM ERROR", `checking if file "${directoryName}" at "${dirPath}" is a Directory`);
              throw new ExtensionError(`FileSystemExp.getFileCount -- Error checking if file "${directoryName}" at "${dirPath}" is a Directory`);
            }
          }
          if (! fileInfo) {
            debug(`getFileCount --  Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
            throw new ExtensionError(`FileSystemExp.getFileCount -- Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
          }

          if (fileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
            throw new ExtensionError(`FileSystemExp.getFileCount -- File "${directoryName}" at "${dirPath}" is not a Directory`);
          }

          try {
            debug(`getFileCount -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
            const children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
            if (children) {
              debug(`getFileCount -- dirPath="${dirPath}" children.length=${children.length}`);
              return children.length;
            } else {
              debug(`getFileCount -- dirPath="${dirPath}" NO CHILDREN}`);
              return 0;
            }
          } catch (error) {
            debug(`getFileCount --  Unable to get shildren for Directory "${directoryName}" at "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.getFileCount -- Unable to get file count for Directory "${directoryName}" at "${dirPath}"`);
          }
        },



        // returns UTF8String
        async readFile(fileName) {
          if (! checkFileName(fileName)) {
            debug(`readFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.readFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`readFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.readFile -- filePath is invalid: "${filePath}"`);
          }

          try {
            debug(`readFile -- calling IOUtils.exists - filePath="${filePath}"`);
            const exists = await IOUtils.exists(filePath); // returns Promise<boolean>
            if (exists) {
              debug(`readFile -- calling IOUtils.readUTF8 - filePath="${filePath}"`);
              const data = await IOUtils.readUTF8(filePath); // returns Promise<UTF8String>
              return data;
            }

          } catch (error) {
            caught(error, "readFile -- FILE SYSTEM ERROR", `reading File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.readFile -- Error reading File "${fileName}" at "${filePath}"`);
          }

          throw new ExtensionError(`FileSystemExp.readFile -- File "${fileName}" at "${filePath}" does not exist`);
        },



        // returns UTF8String
        async readJSONFile(fileName) {
          if (! checkFileName(fileName)) {
            debug(`readJSONFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.readJSONFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`readJSONFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.readJSONFile -- filePath is invalid: "${filePath}"`);
          }

          try {
            debug(`readJSONFile -- calling IOUtils.exists - filePath="${filePath}"`);
            const exists = await IOUtils.exists(filePath); // returns Promise<boolean>
            if (exists) {
              debug(`readJSONFile -- calling IOUtils.readJSON - filePath="${filePath}"`);
              const data = await IOUtils.readJSON(filePath); // returns Promise<any>
              return data;
            }

          } catch (error) {
            caught(error, "readJSONFile -- FILE SYSTEM ERROR", `reading File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.readJSONFile -- Error reading File "${fileName}" at "${filePath}"`);
          }

          throw new ExtensionError(`FileSystemExp.readFile -- File "${fileName}" at "${filePath}" does not exist`);
        },



        // returns object
        async readObjectFromJSONFile(fileName) {
          if (! checkFileName(fileName)) {
            debug(`readObjectFromJSONFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.readObjectFromJSONFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`readObjectFromJSONFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.readObjectFromJSONFile -- filePath is invalid: "${filePath}"`);
          }

          try {
            debug(`readObjectFromJSONFile -- calling IOUtils.exists - filePath="${filePath}"`);
            const exists = await IOUtils.exists(filePath); // returns Promise<boolean>
            if (exists) {
              debug(`readObjectFromJSONFile -- calling IOUtils.readJSON - filePath="${filePath}"`);
              const json = await IOUtils.readJSON(filePath); // returns Promise<any>

              try {
                const object = JSON.parse(json);
                return object;
              } catch (error) {
                caught(error, `readObjectFromJSONFile -- JSON.parse() failed: "${filePath}"`);
                throw new ExtensionError(`FileSystemExp.readObjectFromJSONFile -- Failed to parse JSON: "${filePath}"`);
              }
            }

          } catch (error) {
            caught(error, "readObjectFromJSONFile -- FILE SYSTEM ERROR", `reading File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.readObjectFromJSONFile -- Error reading File "${fileName}" at "${filePath}"`);
          }

          throw new ExtensionError(`FileSystemExp.readObjectFromJSONFile -- File "${fileName}" at "${filePath}" does not exist`);
        },



        // returns unsigned long long
        async writeFile(fileName, data, writeMode) {
          if (! checkFileName(fileName)) {
            debug(`writeFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.writeFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`writeFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.writeFile -- filePath is invalid: "${filePath}"`);
          }

          if (! writeMode) {
            writeMode = 'overwrite';
          } else if (writeMode === 'replace') {
            writeMode = 'overwrite';
          } else if (! checkWriteMode(writeMode)) {
            debug(`writeFile -- Invalid 'writeMode' parameter': "${writeMode}"`);
            throw new ExtensionError(`FileSystemExp.writeFile -- Invalid 'writeMode' parameter: "${writeMode}"`);
          }

          switch (writeMode) {
            case 'append': { // write would fail if the file does NOT exist
              const exists = await IOUtils.exists(filePath); // returns Promise<boolean> // not catching
              if (! exists) {
                debug(`writeFile -- writeMode="${writeMode}" - file does not exist: "${fileName}"`);
                throw new ExtensionError(`FileSystemExp.writeFile -- writeMode="${writeMode}" - file does not exist: "${fileName}"`);
              }
              break;
            }
            case 'create': { // write would fail if the file DOES exist
              const exists = await IOUtils.exists(filePath); // returns Promise<boolean> // not catching
              if (exists) {
                debug(`writeFile -- writeMode="${writeMode}" - file already exists: "${fileName}"`);
                throw new ExtensionError(`FileSystemExp.writeFile: writeMode="${writeMode}" - file already exists: "${fileName}"`);
              }
              break;
            }
          }

          const writeOptions = {"mode": writeMode};

          try {
            debug(`writeFile -- calling IOUtils.writeUTF8 - filePath="${filePath}"`);
            const count = await IOUtils.writeUTF8(filePath, data, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "writeFile -- FILE SYSTEM ERROR", `writing File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.writeFile -- Error writing File "${fileName}" at "${filePath}"`);
          }
        },



        // returns unsigned long long
        async replaceFile(fileName, data) {
          if (! checkFileName(fileName)) {
            debug(`replaceFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.replaceFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`replaceFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.replaceFile -- filePath is invalid: "${filePath}"`);
          }

          const writeOptions = {"mode": 'overwrite'};

          try {
            debug(`replaceFile -- calling IOUtils.writeUTF8 - filePath="${filePath}"`);
            const count = await IOUtils.writeUTF8(filePath, data, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "replaceFile -- FILE SYSTEM ERROR", `writing File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.replaceFile -- Error writing File "${fileName}" at "${filePath}"`);
          }
        },



        // returns unsigned long long
        async appendToFile(fileName, data) {
          if (! checkFileName(fileName)) {
            debug(`appendToFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.appendToFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`appendToFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.appendToFile -- filePath is invalid: "${filePath}"`);
          }

          const writeOptions = {"mode": 'appendOrCreate'};

          try {
            debug(`appendToFile -- calling IOUtils.writeUTF8 - filePath="${filePath}"`);
            const count = await IOUtils.writeUTF8(filePath, data, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "appendToFile -- FILE SYSTEM ERROR", `writing File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.appendToFile -- Error writing File "${fileName}" at "${filePath}"`);
          }
        },



        // returns unsigned long long
        async writeJSONFile(fileName, json, writeMode) {
          if (! checkFileName(fileName)) {
            debug(`writeJSONFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.writeJSONFile -- fileName is invalid: "${fileName}"`);
          }

          if (typeof json !== 'string') {
            debug(`writeJSONFile -- json parameter is not a string: "${typeof json}"`);
            throw new ExtensionError(`FileSystemExp.writeJSONFile -- json parameter is not an string: "${typeof json}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`writeJSONFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.writeJSONFile -- filePath is invalid: "${filePath}"`);
          }

          if (! writeMode) {
            writeMode = 'overwrite';
          } else if (writeMode === 'replace') {
            writeMode = 'overwrite';
          } else if (! checkWriteMode(writeMode)) {
            debug(`writeJSONFile -- Invalid 'writeMode' parameter': "${writeMode}"`);
            throw new ExtensionError(`FileSystemExp.writeJSONFile -- Invalid 'writeMode' parameter: "${writeMode}"`);
          }

          switch (writeMode) {
            case 'append':
            case 'appendOrCreate':
              debug(`writeJSONFile -- Unsupported 'writeMode' parameter' for JSON: "${writeMode}"`);
              throw new ExtensionError(`FileSystemExp.writeJSONFile -- Unsupported 'writeMode' parameter for JSON: "${writeMode}"`);
            case 'create': { // write would fail if the file DOES exist
              const exists = await IOUtils.exists(filePath); // returns Promise<boolean> // not catching
              if (exists) {
                debug(`writeJSONFile -- writeMode="${writeMode}" - file already exists: "${fileName}"`);
                throw new ExtensionError(`FileSystemExp.writeJSONFile: writeMode="${writeMode}" - file already exists: "${fileName}"`);
              }
              break;
            }
          }

          const writeOptions = {"mode": writeMode};

          try {
            debug(`writeJSONFile -- calling IOUtils.writeJSON - filePath="${filePath}"`);
            const count = await IOUtils.writeJSON(filePath, json, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "writeJSONFile -- FILE SYSTEM ERROR", `writing File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.writeJSONFile -- Error writing File "${fileName}" at "${filePath}"`);
          }
        },



        // returns unsigned long long
        async writeObjectToJSONFile(fileName, object, writeMode) {
          if (! checkFileName(fileName)) {
            debug(`writeObjectToJSONFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.writeObjectToJSONFile -- fileName is invalid: "${fileName}"`);
          }

          if (typeof object !== 'object') {
            debug(`writeObjectToJSONFile -- object parameter is not an object: "${typeof object}"`);
            throw new ExtensionError(`FileSystemExp.writeObjectToJSONFile -- object parameter is not an object: "${typeof object}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`writeObjectToJSONFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.writeObjectToJSONFile -- filePath is invalid: "${filePath}"`);
          }

          if (! writeMode) {
            writeMode = 'overwrite';
          } else if (writeMode === 'replace') {
            writeMode = 'overwrite';
          } else if (! checkWriteMode(writeMode)) {
            debug(`writeObjectToJSONFile -- Invalid 'writeMode' parameter': "${writeMode}"`);
            throw new ExtensionError(`FileSystemExp.writeObjectToJSONFile -- Invalid 'writeMode' parameter: "${writeMode}"`);
          }

          switch (writeMode) {
            case 'append':
            case 'appendOrCreate':
              debug(`writeObjectToJSONFile -- Unsupported 'writeMode' parameter' for JSON: "${writeMode}"`);
              throw new ExtensionError(`FileSystemExp.writeObjectToJSONFile -- Unsupported 'writeMode' parameter for JSON: "${writeMode}"`);
            case 'create': { // write would fail if the file DOES exist
              const exists = await IOUtils.exists(filePath); // returns Promise<boolean> // not catching
              if (exists) {
                debug(`writeObjectToJSONFile -- writeMode="${writeMode}" - file already exists: "${fileName}"`);
                throw new ExtensionError(`FileSystemExp.writeObjectToJSONFile: writeMode="${writeMode}" - file already exists: "${fileName}"`);
              }
              break;
            }
          }

          let json;
          try {
            json = JSON.stringify(object);
          } catch (error) {
            caught(error, `writeObjectToJSONFile -- Converting data object to JSON String for "${fileName}":`);
            throw new ExtensionError(`FileSystemExp.writeObjectToJSONFile: Error Converting data object to JSON String for "${fileName}"`);
          }

          const writeOptions = {"mode": writeMode};

          try {
            debug(`writeObjectToJSONFile -- calling IOUtils.writeObjectToJSON - filePath="${filePath}"`);
            const count = await IOUtils.writeJSON(filePath, json, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "writeObjectToJSONFile -- FILE SYSTEM ERROR", `writing File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.writeObjectToJSONFile -- Error writing File "${fileName}" at "${filePath}"`);
          }
        },



        // returns boolean
        async deleteFile(fileName) { /* MUST BE A REGULAR FILE */
          if (! checkFileName(fileName)) {
            debug(`deleteFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.deleteFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`deleteFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.deleteFile -- filePath is invalid: "${filePath}"`);
          }

          debug(`deleteFile -- calling IOUtils.exists - filePath="${filePath}"`);
          const exists = await IOUtils.exists(filePath); // returns Promise<boolean> // not catching
          if (exists) {
            debug(`deleteFile -- calling IOUtils.stat - filePath="${filePath}"`);

            let fileInfo;
            try {
              fileInfo = await IOUtils.stat(filePath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`FileSystemExp.deleteFile -- Error getting FileInfo for File "${fileName}" at "${filePath}"`);
              }
            }

            if (! fileInfo) {
              debug(`deleteFile --  Unable to get file type for File "${fileName}" at "${filePath}" - is it a Regular File?`);
              throw new ExtensionError(`FileSystemExp.deleteFile -- Unable to get file type for File "${fileName}" at "${filePath}" - is it a Regular File?`);

            } else if (fileInfo.type !== 'regular') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`FileSystemExp.deleteFile -- File "${fileName}" at "${filePath}" is not a Regular File`);

            } else {
              try {
                debug(`deleteFile -- calling IOUtils.remove - filePath="${filePath}"`);
                await IOUtils.remove(filePath, {"ignoreAbsent": true, "recursive": false, "retryReadOnly": true}); // returns Promise<undefined> // NOTE: ignoreAbsent
                const existsAfterDelete = await IOUtils.exists(filePath); // returns Promise<boolean>
                return ! existsAfterDelete;

              } catch (error) {
                caught(error, "deleteFile -- FILE SYSTEM ERROR", `deleting File "${fileName}" at "${filePath}"`);
                throw new ExtensionError(`FileSystemExp.deleteFile -- Error deleting File "${fileName}" at "${filePath}"`);
              }
            }
          }

          return false; // MABXXX maybe should throw instead
        },



        // returns boolean
        async deleteDirectory(directoryName, recursive) { /* MUST BE A DIRECTORY */
          if (directoryName && ! checkDirectoryName(directoryName)) { // directoryName is optional
            debug(`deleteDirectory -- directoryName is invalid: "${directoryName}"`);
            throw new ExtensionError(`FileSystemExp.deleteDirectory -- directoryName is invalid: "${directoryName}"`);
          }

          if (typeof recursive === 'undefined') {
            recursive = false;
          } else if (typeof recursive !== 'boolean') {
            debug(`deleteDirectory -- 'recursive' parameter is not 'boolean': "${typeof recursive}"`);
            throw new ExtensionError(`FileSystemExp.deleteDirectory -- 'recursive' parameter is not 'boolean': "${typeof recursive}"`);
          }

          const dirPath = buildPathName(context, directoryName);
          if (! checkFilePath(dirPath)) {
            debug(`deleteDirectory -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.deleteDirectory -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`deleteDirectory -- calling IOUtils.exists - dirPath="${dirPath}"`);
          const exists = await IOUtils.exists(dirPath); // returns Promise<boolean> // not catching
          if (exists) {
            debug(`deleteDirectory -- calling IOUtils.stat - dirPath="${dirPath}"`);

            let fileInfo;
            try {
              fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`FileSystemExp.deleteDirectory -- Error getting FileInfo for File "${directoryName}" at "${dirPath}"`);
              }
            }

            if (! fileInfo) {
              debug(`deleteDirectory --  Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
              throw new ExtensionError(`FileSystemExp.deleteDirectory -- Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);

            } else if (fileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`FileSystemExp.deleteDirectory -- File "${directoryName}" at "${dirPath}" is not a Directory`);

            } else {
              if (! recursive) {
                let hasChildren
                try {
                  debug(`deleteDirectory -- calling IOUtils.hasChildren = dirPath="${dirPath}"`);
                  hasChildren = await IOUtils.hasChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
                } catch (error) {
                  debug(`deleteDirectory --  Unable to get hasChildren for Directory "${directoryName}" at "${dirPath}"`);
                  throw new ExtensionError(`FileSystemExp.deleteDirectory -- Unable to check if Directory has files at "${dirPath}"`);
                }

                if (hasChildren) {
                  debug(`deleteDirectory --  Cannot delete Directory "${directoryName}" at "${dirPath}" - it has files`);
                  throw new ExtensionError(`FileSystemExp.deleteDirectory -- Cannot delete Directory "${directoryName}" at "${dirPath}" - it  has files`);
                }
              }

              try {
                debug(`deleteDirectory -- calling IOUtils.remove - dirPath="${dirPath}"`);
                await IOUtils.remove(dirPath, {"ignoreAbsent": true, "recursive": recursive, "retryReadOnly": true}); // returns Promise<undefined> // NOTE: ignoreAbsent
                debug(`deleteDirectory -- calling IOUtils.exists - dirPath="${dirPath}"`);
                const existsAfterDelete = await IOUtils.exists(dirPath); // returns Promise<boolean>
                return ! existsAfterDelete;

              } catch (error) {
                caught(error, "deleteDirectory -- FILE SYSTEM ERROR", `deleting Directory "${directoryName}" at "${dirPath}"`);
                throw new ExtensionError(`FileSystemExp.deleteDirectory -- Error deleting Directory "${directoryName}" at "${dirPath}"`);
              }
            }
          }

          return false; // MABXXX maybe should throw instead
        },



        // returns boolean
        async makeDirectory() {
          const dirPath = buildPathName(context);
          if (! checkFilePath(dirPath)) {
            debug(`makeDirectory -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.makeDirectory -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`makeDirectory -- calling IOUtils.exists - dirPath="${dirPath}"`);
          const exists = await IOUtils.exists(dirPath); // returns Promise<boolean> // not catching
          if (exists) {
            let fileInfo;
            try {
              debug(`makeDirectory -- calling IOUtils.stat - dirPath="${dirPath}"`);
              fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`FileSystemExp.makeDirectory -- Error getting FileInfo for File at "${dirPath}"`);
              }
            }
            if (! fileInfo) {
              debug(`makeDirectory --  Unable to get file type for File at "${dirPath}"`);
              throw new ExtensionError(`FileSystemExp.makeDirectory-- Unable to get file type for File at "${dirPath}"`);
            }

            // MABXXX SHOULD THESE BE VALIDATON ERRORS INSTEAD???????????????
            if (fileInfo.type === 'regular') { // enum FileType { "regular", "directory", "other" };
              debug(`makeDirectory -- Regular File already exists dirPath="${dirPath}"`);
            } else if (fileInfo.type === 'directory') { // enum FileType { "regular", "directory", "other" };
              debug(`makeDirectory -- Directory already exists dirPath="${dirPath}"`);
            } else {
              debug(`makeDirectory -- File System object already exists dirPath="${dirPath}"`);
            }

            return false; // should this be a validation error instead???

          } else {
            try {
              debug(`makeDirectory -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: createAncestors, ignoreExisting
              return true;

            } catch (error) {
              caught(error, "makeDirectory -- FILE SYSTEM ERROR", `Failed to create Directory at "${dirPath}"`);
              throw new ExtensionError(`FileSystemExp.makeDirectory Failed to create Directory at "${dirPath}"`);
            }
          }
        },



        // returns an IOUtils.FileInfo or undefined if the file does not exist
        // (MABXXX maybe exception actually WOULD be better than undefined?)
        // (MABXXX maybe list the definition of FileInfo here)
        async getFileInfo(fileName) {
          if (fileName && ! checkFileName(fileName)) { // fileName is optional
            debug(`getFileInfo -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.getFileInfo -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, fileName);
          if (! checkFilePath(filePath)) {
            debug(`getFileInfo -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`FileSystemExp.getFileInfo -- filePath is invalid: "${filePath}"`);
          }

          debug(`getFileInfo -- calling IOUtils.exists - filePath="${filePath}"`);
          const exists = await IOUtils.exists(filePath); // returns Promise<boolean> // not catching
          if (exists) {
            try {
              debug(`getFileInfo -- calling IOUtils.stat - filePath="${filePath}"`);
              // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              const fileInfo = await IOUtils.stat(filePath); // returns Promise<FileInfo>
              if (fileName) {
                fileInfo.fileName = fileName;
              } else {
                fileInfo.fileName = context.extension.id;
              }
              return fileInfo;

            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') { // sometimes stat() throws NotFoundError even though exists() returns true
                throw new ExtensionError(`FileSystemExp.getFileInfo -- Error getting FileInfo for File "${fileName}" at "${filePath}"`);
              }
            }
          }

          return; // undefined
        },



        // Renames a file
        async renameFile(fromFileName, toFileName, overwrite) {
          if (! checkFileName(fromFileName)) {
            debug(`renameFile -- fromFileName is invalid: "${fromFileName}"`);
            throw new ExtensionError(`FileSystemExp.renameFile -- fromFileName is invalid: "${fromFileName}"`);
          }

          if (! checkFileName(toFileName)) {
            debug(`renameFile -- toFileName is invalid: "${toFileName}"`);
            throw new ExtensionError(`FileSystemExp.renameFile -- toFileName is invalid: "${toFileName}"`);
          }

          const fromFilePath = buildPathName(context, fromFileName);
          if (! checkFilePath(fromFilePath)) {
            debug(`renameFile -- fromFilePath is invalid: "${fromFilePath}"`);
            throw new ExtensionError(`FileSystemExp.renameFile -- fromFilePath is invalid: "${fromFilePath}"`);
          }

          const toFilePath = buildPathName(context, toFileName);
          if (! checkFilePath(toFilePath)) {
            debug(`renameFile -- toFilePath is invalid: "${toFilePath}"`);
            throw new ExtensionError(`FileSystemExp.renameFile -- toFilePath is invalid: "${toFilePath}"`);
          }

          debug(`renameFile -- calling IOUtils.exists - fromFilePath="${fromFilePath}"`);
          const fromFileExists = await IOUtils.exists(fromFilePath); // returns Promise<boolean> // not catching
          if (! fromFileExists) {
            throw new ExtensionError(`FileSystemExp.renameFile -- fromFile does not exist: "${fromFileName}" at "${fromFilePath}"`);
          }
          
          try {
            debug(`renameFile -- calling IOUtils.stat - fromFilePath="${fromFilePath}"`);
            // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            const fromFileInfo = await IOUtils.stat(fromFilePath); // returns Promise<FileInfo>
            if (fromFileInfo.type !== 'regular') {
              throw new ExtensionError(`FileSystemExp.renameFile -- rename fromFile is not a Regular File: "${fromFileName}" at "${fromFilePath}"`);
            }
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            if (error.name !== 'NotFoundError') { // sometimes stat() throws NotFoundError even though exists() returns true
              throw new ExtensionError(`FileSystemExp.renameFile -- Error getting FileInfo for rename fromFile "${fromFileName}" at "${fromFilePath}"`);
            }
          }

          let toFileOverwrite = false;
          if (typeof overwrite !== 'undefined') { // overwrite is optional and schema.json makes sure it's boolean
            toFileOverwrite = overwrite;
          }
          
          if (! toFileOverwrite) {
            try {
              debug(`renameFile -- calling IOUtils.stat - toFilePath="${toFilePath}"`);
              // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              const toFileExists = await IOUtils.exists(toFilePath);
              if (toFileExists) {
                throw new ExtensionError(`FileSystemExp.renameFile -- rename toFile already exists: "${toFileName}" at "${toFilePath}"`);
              }
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') { // sometimes stat() throws NotFoundError even though exists() returns true
                throw new ExtensionError(`FileSystemExp.renameFile -- Error checking if rename toFile exists: "${toFileName}" at "${toFilePath}"`);
              }
            }
          }
          
          try {
            await IOUtils.move(fromFilePath, toFilePath, { 'overwrite': toFileOverwrite } );
            return true;
          } catch (error) {
            throw new ExtensionError(`FileSystemExp.renameFile -- Error renaming file: "${fromFileName}" at "${fromFilePath}" to "${toFileName}" at "${toFilePath}" `);
          }

          return false;
        },



        // returns array of DOMString, the base names (last components in the paths) of only the (matching) Regular files
        // optional matchGLOB must be a String
        // NOTE: If the extension directory does not exist, create it MABXXX BUT WHY???
        async listFiles(matchGLOB) {
          let matchRegExp;
          if (matchGLOB) matchRegExp = globToRegExp(matchGLOB);

          const dirPath = buildPathName(context); // notice no fileName parameter
          if (! checkFilePath(dirPath)) {
            debug(`listFiles -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.listFiles -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`listFiles -- calling IOUtils.exists - dirPath="${dirPath}"`);
          const exists = await IOUtils.exists(dirPath); // returns Promise<boolean> // not catching
          if (exists) {
            debug(`listFiles -- calling IOUtils.stat - dirPath="${dirPath}"`);

            let dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') {
                caught(error, "listFiles -- FILE SYSTEM ERROR", `listing files at "${dirPath}"`);
                throw new ExtensionError(`FileSystemExp.listFiles -- Error listing files at "${dirPath}"`);
              }
            }
            if (! dirFileInfo) {
              throw new ExtensionError(`FileSystemExp.listFiles Unable to get file type for Directory at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`FileSystemExp.listFiles Directory at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
            }

            try {
              const fileNames = [];
              debug(`listFiles -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
              const children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
              if (children) {
                for (const filePath of children) {
                  const fileName = PathUtils.filename(filePath);
                  if (! matchRegExp || matchRegExp.test(fileName)) {
                    let fileInfo
                    try {
                      fileInfo = await IOUtils.stat(filePath); // returns Promise<FileInfo>
                    } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
                      if (error.name !== 'NotFoundError') {
                        caught(error, "listFiles -- FILE SYSTEM ERROR", `getting FileInfo for "${filePath}"`);
                        throw new ExtensionError(`FileSystemExp.listFiles -- Error listing files at "${dirPath}"`);
                      }
                    }
                    if (! fileInfo) {
                      throw new ExtensionError(`FileSystemExp.listFiles Unable to get file type for File "${fileName}" at "${dirPath}" - is it a File?`);
                    } else if (fileInfo.type === 'regular') { // enum FileType { "regular", "directory", "other" };
                      fileNames.push(fileName);
                    }
                  }
                }
              }

              return fileNames; // return array of String

            } catch (error) {
              caught(error, "listFiles -- FILE SYSTEM ERROR", `listing files in Directory at "${dirPath}"`);
              throw new ExtensionError(`FileSystemExp.listFiles -- Error listing files in Directory at "${dirPath}"`);
            }

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`listFiles -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "listFiles -- FILE SYSTEM ERROR", `Failed to create Directory at "${dirPath}"`);
              throw new ExtensionError(`FileSystemExp.listFiles -- Failed to create Directory at "${dirPath}"`);
            }
          }
        },



        // returns array of FileInfo for only the (matching) Regular Files
        // optional matchGLOB must be a String
        // NOTE: If the extension directory does not exist, create it MABXXX BUT WHY???
        async listFileInfo(matchGLOB) {
          let matchRegExp;
          if (matchGLOB) matchRegExp = globToRegExp(matchGLOB);

          const dirPath = buildPathName(context); // notice no fileName parameter
          if (! checkFilePath(dirPath)) {
            debug(`listFileInfo -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.listFileInfo -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`listFileInfo -- calling IOUtils.exists - dirPath="${dirPath}"`);
          const exists = await IOUtils.exists(dirPath); // returns Promise<boolean> // not catching
          if (exists) {
            debug(`listFileInfo -- calling IOUtils.stat - dirPath="${dirPath}"`);

            let dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') {
                caught(error, "listFileInfo -- FILE SYSTEM ERROR", `listing files at "${dirPath}"`);
                throw new ExtensionError(`FileSystemExp.listFileInfo -- Error listing files at "${dirPath}"`);
              }
            }
            if (! dirFileInfo) {
              throw new ExtensionError(`FileSystemExp.listFileInfo Unable to get file type for Directory at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`FileSystemExp.listFileInfo Directory at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
            }

            try {
              const fileInfo = [];
              debug(`listFileInfo -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
              const children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
              if (children) {
                for (const filePath of children) {
                  const fileName = PathUtils.filename(filePath);
                  if (! matchRegExp || matchRegExp.test(fileName)) {
                    let stat
                    try {
                      stat = await IOUtils.stat(filePath); // returns Promise<FileInfo>
                    } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
                      if (error.name !== 'NotFoundError') {
                        caught(error, "listFileInfo -- FILE SYSTEM ERROR", `getting FileInfo for "${filePath}"`);
                        throw new ExtensionError(`FileSystemExp.listFileInfo -- Error listing files at "${dirPath}"`);
                      }
                    }
                    if (! stat) {
                      throw new ExtensionError(`FileSystemExp.listFileInfo Unable to get file type for File "${fileName}" at "${dirPath}" - is it a File?`);
                    } else if (stat.type === 'regular') { // enum FileType { "regular", "directory", "other" };
                      stat.fileName = fileName;
                      fileInfo.push(stat);
                    }
                  }
                }
              }

              return fileInfo; // return array of FileInfo

            } catch (error) {
              caught(error, "listFileInfo -- FILE SYSTEM ERROR", `listing files in Directory at "${dirPath}"`);
              throw new ExtensionError(`FileSystemExp.listFileInfo -- Error listing files in Directory at "${dirPath}"`);
            }

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`listFileInfo -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "listFileInfo -- FILE SYSTEM ERROR", `Failed to create Directory at "${dirPath}"`);
              throw new ExtensionError(`FileSystemExp.listFileInfo -- Failed to create Directory at "${dirPath}"`);
            }
          }
        },



        // returns array of DOMString, the base names (last components in the paths) of the all (matching) items
        // optional matchGLOB must be a String
        // NOTE: If the extension directory does not exist, create it MABXXX BUT WHY???
        async list(matchGLOB) {
          let matchRegExp;
          if (matchGLOB) matchRegExp = globToRegExp(matchGLOB);

          const dirPath = buildPathName(context); // notice no fileName parameter
          if (! checkFilePath(dirPath)) {
            debug(`list -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.list -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`list -- calling IOUtils.exists - dirPath="${dirPath}"`);
          const exists = await IOUtils.exists(dirPath); // returns Promise<boolean> // not catching
          if (exists) {
            debug(`list -- calling IOUtils.stat - dirPath="${dirPath}"`);

            let dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') {
                caught(error, "list -- FILE SYSTEM ERROR", `listing items at "${dirPath}"`);
                throw new ExtensionError(`FileSystemExp.list -- Error listing items at "${dirPath}"`);
              }
            }
            if (! dirFileInfo) {
              throw new ExtensionError(`FileSystemExp.list Unable to get file type for Directory at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`FileSystemExp.list Directory at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
            }

            try {
              const fileNames = [];
              debug(`list -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
              const children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
              if (children) {
                for (const child of children) {
                  const fileName = PathUtils.filename(child);
                  if (! matchRegExp || matchRegExp.test(fileName)) fileNames.push(fileName);
                }
              }

              return fileNames; // return array of String

            } catch (error) {
              caught(error, "list -- FILE SYSTEM ERROR", `listing items in Directory at "${dirPath}"`);
              throw new ExtensionError(`FileSystemExp.list -- Error listing items in Directory at "${dirPath}"`);
            }

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`list -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "list -- FILE SYSTEM ERROR", `Failed to create Directory at "${dirPath}"`);
              throw new ExtensionError(`FileSystemExp.list -- Failed to create Directory at "${dirPath}"`);
            }
          }
        },



        // returns array of FileInfo for all (matching) items
        // optional matchGLOB must be a String
        // NOTE: If the extension directory does not exist, create it MABXXX BUT WHY???
        async listInfo(matchGLOB) {
          let matchRegExp;
          if (matchGLOB) matchRegExp = globToRegExp(matchGLOB);

          const dirPath = buildPathName(context); // notice no fileName parameter
          if (! checkFilePath(dirPath)) {
            debug(`listInfo -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`FileSystemExp.listInfo -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`listInfo -- calling IOUtils.exists - dirPath="${dirPath}"`);
          const exists = await IOUtils.exists(dirPath); // returns Promise<boolean> // not catching
          if (exists) {
            debug(`listInfo -- calling IOUtils.stat - dirPath="${dirPath}"`);

            let dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') {
                caught(error, "listInfo -- FILE SYSTEM ERROR", `listing files at "${dirPath}"`);
                throw new ExtensionError(`FileSystemExp.listInfo -- Error listing files at "${dirPath}"`);
              }
            }
            if (! dirFileInfo) {
              throw new ExtensionError(`FileSystemExp.listInfo Unable to get file type for Directory at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`FileSystemExp.listInfo Directory at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
            }

            try {
              const fileInfo = [];
              debug(`listInfo -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
              const children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
              if (children) {
                for (const filePath of children) {
                  const fileName = PathUtils.filename(filePath);
                  if (! matchRegExp || matchRegExp.test(fileName)) {
                    let stat
                    try {
                      stat = await IOUtils.stat(filePath); // returns Promise<FileInfo>
                    } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
                      if (error.name !== 'NotFoundError') {
                        caught(error, "listInfo -- FILE SYSTEM ERROR", `getting FileInfo for "${filePath}"`);
                        throw new ExtensionError(`FileSystemExp.listInfo -- Error listing files at "${dirPath}"`);
                      }
                    }
                    if (! stat) {
                      throw new ExtensionError(`FileSystemExp.listInfo Unable to get file type for File "${fileName}" at "${dirPath}" - is it a File?`);
                    } else {
                      stat.fileName = fileName;
                      fileInfo.push(stat);
                    }
                  }
                }
              }

              return fileInfo; // return array of FileInfo

            } catch (error) {
              caught(error, "listInfo -- FILE SYSTEM ERROR", `listing files in Directory at "${dirPath}"`);
              throw new ExtensionError(`FileSystemExp.listInfo -- Error listing files in Directory at "${dirPath}"`);
            }

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`listInfo -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "listInfo -- FILE SYSTEM ERROR", `Failed to create Directory at "${dirPath}"`);
              throw new ExtensionError(`FileSystemExp.listInfo -- Failed to create Directory at "${dirPath}"`);
            }
          }
        },



        // returns String
        async getFullPathName(fileName) {
          if (fileName && ! checkFileName(fileName)) { // fileName is optional
            debug(`getFullPathName -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`FileSystemExp.getFullPathName -- fileName is invalid: "${fileName}"`);
          }

          return buildPathName(context, fileName); // returns String
        },



        // returns boolean
        async isValidFileName(fileName) {
          return checkFileName(fileName); // returns boolean
        },



        // returns boolean
        async isValidDirectoryName(directoryName) {
          return checkDirectoryName(directoryName); // returns boolean
        },



        // returns string
        async getFileSystemPathName(fileName) {
          return PathUtils.join(PathUtils.profileDir, "FileSystemExp");
        },

      }
    };
  }

};



function buildPathName(context, fileName) {

  if (fileName) return PathUtils.join(PathUtils.profileDir, "FileSystemExp", context.extension.id, fileName);
  return PathUtils.join(PathUtils.profileDir, "FileSystemExp", context.extension.id);
}



/* Must be a String with at least 1 character and <= 255 characters. */
function checkFilePath(filePath) {
  return ((typeof filePath === 'string') && filePath.length >= 1 && filePath.length <= 255);
}



/* Must be a String with at least one character.
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
 * AND FOR DIRECTORY NAMES:
 * - ..
 *
 * NO MORE THAN *64* CHARACTERS
 */
function checkFileName(fileName) {
  if (typeof fileName !== 'string' || fileName.length < 1 || fileName.length > 64) return false;

  const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
  if (ILLEGAL_CHARS.test(fileName)) return false;

  const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  if (RESERVED_NAMES.test(fileName)) return false;

  return true;
}

function checkDirectoryName(dirName) {
  if (typeof dirName !== 'string' || dirName.length < 1 || dirName.length > 64) return false;

  const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
  if (ILLEGAL_CHARS.test(dirName)) return false;

  const RESERVED_NAMES = /^(\.\.|con|prn|aux|nul|com[0-9]|lpt[0-9])$/i; // adds ".."
  if (RESERVED_NAMES.test(dirName)) return false;

  return true;
}




function checkWriteMode(writeMode) {
  if (typeof writeMode !== 'string') return false;

  switch (writeMode) {
    case 'overwrite':
    case 'replace':        // synonym for 'overwrite'
    case 'append':
    case 'appendOrCreate':
    case 'create':
      return true;
  }

  return false;
}



function globToRegExp(glob) {
  const regexp = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regexp}$`);
}

function isGlobMatch(string, glob) {
  const regexp = globToRegExp(glob);
  return regexp.test(string);
}



const DEBUG = false;

function debug(...info) {
  if (! DEBUG) return;
  const msg = info.shift();
  console.debug("FileSystemExp#" + msg, ...info);
}

function debugAlways(...info) {
  const msg = info.shift();
  console.debug("FileSystemExp#" + msg, ...info);
}

function caught(e, ...info) {
  const msg = info.shift();
  console.error( "FileSystemExp#" + msg,
                 "\n- error.name:    " + e.name,
                 "\n- error.message: " + e.message,
                 "\n- error.stack:   " + e.stack,
                 "\n- ",
                 ...info
               );
}
