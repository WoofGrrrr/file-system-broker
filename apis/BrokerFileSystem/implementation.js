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
 *   . renameFile
 *   . deleteFile
 *   . deleteDirectory - Can delete ONLY the directory for the extensionId. (There is currently no ability to make sub-directtories, and FileNames cannot contain path separator characters.)
 *   . makeDirectory - Can make only the directory for the extensionId.  Cannot make sub-directories.
 *   . listFiles - with optional fileName match GLOB
 *   . list - with optional fileName match GLOB
 *   . listFileInfo - with optional fileName match GLOB
 *   . listInfo- with optional fileName match GLOB
 *   . getFullPathName
 *   . isValidFileName
 *   . isValidDirectoryName
 *   . getFileSystemPathName
 *   . stats
 *   . fsbListInfo
 *   . fsbList
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

var BrokerFileSystem = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {

      BrokerFileSystem: {

        // returns boolean
        async exists(extensionId, itemName) {
          if (! checkExtensionId(extensionId)) {
            debug(`exists -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.exists -- extensionId is invalid: "${extensionId}"`);
          }

          if (itemName && ! checkFileName(itemName)) { // itemName is optional
            throw new ExtensionError(`BrokerFileSystem.exists -- itemName is invalid: "${itemName}"`);
          }

          const itemPath = buildPathName(context, extensionId, itemName);
          if (! checkPathName(itemPath)) {
            throw new ExtensionError(`BrokerFileSystem.exists -- itemPath is invalid: "${itemPath}"`);
          }

          debug(`exists -- calling IOUtils.exists - itemPath="${itemPath}"`);
          try {
            const exists = await IOUtils.exists(itemPath); // returns Promise<boolean>
            return exists;
          } catch (error) {
            caught(error, "exists -- FILE SYSTEM ERROR", `Calling IOUtils.exists() for Item "${itemName}" at "${itemPath}"`);
            throw new ExtensionError(`BrokerFileSystem.exists -- Error checking existence of File "${itemName}" at "${itemPath}"`);
          }
        },



        // returns boolean
        async isRegularFile(extensionId, fileName) {
          if (! checkExtensionId(extensionId)) {
            debug(`isRegularFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.isRegularFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (fileName && ! checkFileName(fileName)) { // fileName is optional
            debug(`isRegularFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.isRegularFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkPathName(filePath)) {
            debug(`isRegularFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.isRegularFile -- filePath is invalid: "${filePath}"`);
          }

          debug(`isRegularFile -- calling IOUtils.exists - filePath="${filePath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(filePath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "isRegularFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on Item "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.isRegularFile -- Error checking existence of Item "${fileName}" at "${filePath}"`);
          }

          if (! exists) return false;

          debug(`isRegularFile -- calling IOUtils.stat - filePath="${filePath}"`);
          let fileInfo;
          try {
            fileInfo = await IOUtils.stat(filePath); // returns Promise<FileInfo>
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            caught(error, "isRegularFile -- FILE SYSTEM ERROR", `Calling stat() for Item "${fileName}" at "${filePath}", is it a Regular File?`);
            if (error.name !== 'NotFoundError') {
              throw new ExtensionError(`BrokerFileSystem.isRegularFile -- Error checking if File "${fileName}" at "${filePath}" is a Regular File`);
            }
          }

          if (! fileInfo) {
            debug(`isRegularFile --  Unable to get file type for File "${fileName}" at "${filePath}" - is it a Regular File?`);
            throw new ExtensionError(`BrokerFileSystem.isRegularFile -- Unable to get file type for File "${fileName}" at "${filePath}" - is it a Regular File?`);
          }

          return (fileInfo.type === 'regular'); // enum FileType { "regular", "directory", "other" };
        },



        // returns boolean
        async isDirectory(extensionId, directoryName) {
          if (! checkExtensionId(extensionId)) {
            debug(`isDirectory -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.isDirectory -- extensionId is invalid: "${extensionId}"`);
          }

          if (directoryName && ! checkDirectoryName(directoryName)) { // directoryName is optional
            debug(`isDirectory -- directoryName is invalid: "${directoryName}"`);
            throw new ExtensionError(`BrokerFileSystem.isDirectory -- directoryName is invalid: "${directoryName}"`);
          }

          const dirPath = buildPathName(context, extensionId, directoryName);
          if (! checkPathName(dirPath)) {
            debug(`isDirectory -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.isDirectory -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`isDirectory -- calling IOUtils.exists - dirPath="${dirPath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "isDirectory -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on Item "${directoryName}" at "${dirPath}"`); 
            throw new ExtensionError(`BrokerFileSystem.isDirectory -- Error checking existence of Item "${directoryName}" at "${dirPath}"`);
          }

          if (! exists) return false;

          debug(`isDirectory -- calling IOUtils.stat - dirPath="${dirPath}"`);
          let fileInfo;
          try {
            fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            caught(error, "isDirectory -- FILE SYSTEM ERROR", `Calling stat() for Item "${directoryName}" at "${dirPath}", is it a Directory?`);
            if (error.name !== 'NotFoundError') {
              throw new ExtensionError(`BrokerFileSystem.isDirectory -- Error checking if File "${directoryName}" at "${dirPath}" is a Directory`);
            }
          }

          if (! fileInfo) {
            debug(`isDirectory --  Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
            throw new ExtensionError(`BrokerFileSystem.isDirectory -- Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
          }

          return (fileInfo.type === 'directory'); // enum FileType { "regular", "directory", "other" };
        },



        // returns boolean
        async hasFiles(extensionId, directoryName) {
          if (! checkExtensionId(extensionId)) {
            debug(`hasFiles -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- extensionId is invalid: "${extensionId}"`);
          }

          if (directoryName && ! checkDirectoryName(directoryName)) { // directoryName is optional
            debug(`hasFiles -- directoryName is invalid: "${directoryName}"`);
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- directoryName is invalid: "${directoryName}"`);
          }

          const dirPath = buildPathName(context, extensionId, directoryName);
          if (! checkPathName(dirPath)) {
            debug(`hasFiles -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- dirPath is invalid: "${dirPath}"`);
          }

          let exists;
          try {
            debug(`hasFiles -- calling IOUtils.exists - dirPath="${dirPath}"`);
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "hasFiles -- FILE SYSTEM ERROR", `Calling IOUtils.exists() for Item "${directoryName}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- Error checking if file "${directoryName}" at "${dirPath}" exists`);
          }

          if (! exists) {
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- File "${directoryName}" at "${dirPath}" does not exist`);
          }

          debug(`hasFiles -- calling IOUtils.stat - dirPath="${dirPath}"`);
          let fileInfo;
          try {
            fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            if (error.name !== 'NotFoundError') {
              caught(error, "hasFiles -- FILE SYSTEM ERROR", `Calling stat() for Item "${directoryName}" at "${dirPath}", is it a Directory?`);
              throw new ExtensionError(`BrokerFileSystem.hasFiles -- Error checking if file "${directoryName}" at "${dirPath}" is a Directory`);
            }
          }

          if (! fileInfo) {
            debug(`hasFiles --  Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
          }

          if (fileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- File "${directoryName}" at "${dirPath}" is not a Directory`);
          }

          debug(`hasFiles -- calling IOUtils.hasChildren - dirPath="${dirPath}"`);
          try {
            const hasChildren = await IOUtils.hasChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<boolean> // NOTE: ignoreAbsent
            debug(`hasFiles -- dirPath="${dirPath}" hasChildren=${hasChildren}`);
            return hasChildren;
          } catch (error) {
            debug(`hasFiles -- Calling IOUtils.hasFiles() for Directory "${directoryName}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- Unable to check if Directory "${directoryName}" has files at "${dirPath}"`);
          }
        },



        // returns integer
        async getFileCount(extensionId, directoryName) {
          if (! checkExtensionId(extensionId)) {
            debug(`getFileCount -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- extensionId is invalid: "${extensionId}"`);
          }

          if (directoryName && ! checkDirectoryName(directoryName)) { // directoryName is optional
            debug(`getFileCount -- directoryName is invalid: "${directoryName}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- directoryName is invalid: "${directoryName}"`);
          }

          const dirPath = buildPathName(context, extensionId, directoryName);
          if (! checkPathName(dirPath)) {
            debug(`getFileCount -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`getFileCount -- calling IOUtils.exists - dirPath="${dirPath}"`);
          let exists;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "getFileCount -- FILE SYSTEM ERROR", `Calling IOUtils.exists for Item "${directoryName}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- Error checking if file "${directoryName}" at "${dirPath}" exists`);
          }

          if (! exists) {
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- File "${directoryName}" at "${dirPath}" does not exist`);
          }

          debug(`getFileCount -- calling IOUtils.stat - dirPath="${dirPath}"`);
          let fileInfo;
          try {
            fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            caught(error, "getFileCount -- FILE SYSTEM ERROR", `Calling stat() for Item "${directoryName}" at "${dirPath}", is it a Directory?`);
            if (error.name !== 'NotFoundError') {
              throw new ExtensionError(`BrokerFileSystem.getFileCount -- Error checking if file "${directoryName}" at "${dirPath}" is a Directory`);
            }
          }

          if (! fileInfo) {
            debug(`getFileCount --  Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
          }

          if (fileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- File "${directoryName}" at "${dirPath}" is not a Directory`);
          }

          debug(`getFileCount -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
          try {
            const children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
            if (children) {
              debug(`getFileCount -- dirPath="${dirPath}" children.length=${children.length}`);
              return children.length;
            } else {
              debug(`getFileCount -- dirPath="${dirPath}" NO CHILDREN}`);
              return 0;
            }
          } catch (error) {
            caught(error, "getFileCount -- FILE SYSTEM ERROR", `Calling IOUtils.getChildren() for Directory "${directoryName}" at "${dirPath}", is it a Directory?`);
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- Unable to get file count for Directory "${directoryName}" at "${dirPath}"`);
          }
        },



        // returns UTF8String
        async readFile(extensionId, fileName) {
          if (! checkExtensionId(extensionId)) {
            debug(`readFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.readFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (! checkFileName(fileName)) {
            debug(`readFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.readFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkPathName(filePath)) {
            debug(`readFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readFile -- filePath is invalid: "${filePath}"`);
          }

          debug(`readFile -- calling IOUtils.exists - filePath="${filePath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(filePath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "readFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() for Item "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readFile -- Checking existence of Item "${fileName}" at "${filePath}"`);
          }

          if (! exists) {
            throw new ExtensionError(`BrokerFileSystem.readFile -- File "${fileName}" at "${filePath}" does not exist`);
          }

          debug(`readFile -- calling IOUtils.stat - filePath="${filePath}"`);
          var stat;
          try {
            stat = await IOUtils.stat(filePath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "readFile -- FILE SYSTEM ERROR", `Calling IOUtils.stat() for Item "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readFile -- Getting information about Item "${fileName}" at "${filePath}"`);
          }

          if (! stat) {
            throw new ExtensionError(`BrokerFileSystem.readFile -- Unable to get information about about Item "${fileName}" at "${filePath}"`);
          } else if (stat.type !== 'regular') {
            throw new ExtensionError(`BrokerFileSystem.readFile -- Item "${fileName}" at "${filePath}" is not a File`);
          }

          try {
            debug(`readFile -- calling IOUtils.readUTF8 - filePath="${filePath}"`);
            const data = await IOUtils.readUTF8(filePath); // returns Promise<UTF8String>
            return data;
          } catch (error) {
            caught(error, "readFile -- FILE SYSTEM ERROR", `Calling IOUtils.readUTF8() for File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readFile -- Error reading File "${fileName}" at "${filePath}"`);
          }

          throw new ExtensionError(`BrokerFileSystem.readFile -- File "${fileName}" at "${filePath}" does not exist`);
        },



        // returns UTF8String
        async readJSONFile(extensionId, fileName) {
          if (! checkExtensionId(extensionId)) {
            debug(`readJSONFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (! checkFileName(fileName)) {
            debug(`readJSONFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkPathName(filePath)) {
            debug(`readJSONFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- filePath is invalid: "${filePath}"`);
          }

          debug(`readJSONFile -- calling IOUtils.exists - filePath="${filePath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(filePath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "readJSONFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- Error reading File "${fileName}" at "${filePath}"`);
          }

          if (! exists) {
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- File "${fileName}" at "${filePath}" does not exist`);
          }

          debug(`readJSONFile -- calling IOUtils.stat - filePath="${filePath}"`);
          var stat;
          try {
            stat = await IOUtils.stat(filePath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "readJSONFile -- FILE SYSTEM ERROR", `Calling IOUtils.stat() for Item "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- Getting information about Item "${fileName}" at "${filePath}"`);
          }

          if (! stat) {
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- Unable to get information about about Item "${fileName}" at "${filePath}"`);
          } else if (stat.type !== 'regular') {
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- Item "${fileName}" at "${filePath}" is not a File`);
          }

          debug(`readJSONFile -- calling IOUtils.readJSON - filePath="${filePath}"`);
          try {
            const data = await IOUtils.readJSON(filePath); // returns Promise<any>
            return data;
          } catch (error) {
            caught(error, "readJSONFile -- FILE SYSTEM ERROR", `Calling IOUtils.readJSON() on File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- Error reading File "${fileName}" at "${filePath}"`);
          }

        },



        // returns object
        async readObjectFromJSONFile(extensionId, fileName) {
          debug(`readObjectFromJSONFile -- extensionId="${extensionId}" fileName="${fileName}" `);
          if (! checkExtensionId(extensionId)) {
            debug(`readObjectFromJSONFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (! checkFileName(fileName)) {
            debug(`readObjectFromJSONFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkPathName(filePath)) {
            debug(`readObjectFromJSONFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- filePath is invalid: "${filePath}"`);
          }

          debug(`readObjectFromJSONFile -- calling IOUtils.exists - filePath="${filePath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(filePath); // returns Promise<boolean>
          } catch (error) {
            caught(error, `readObjectFromJSONFile -- Calling IOUtils.exists() on File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- Failed to check existence of File "${fileName}" at "${filePath}"`);
          }

          if (! exists) {
            throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- File "${fileName}" at "${filePath}" does not exist`);
          }

          debug(`readObjectFromJSONFile -- Calling IOUtils.readJSON() - filePath="${filePath}"`);
          var json = await IOUtils.readJSON(filePath); // returns Promise<any>
          try {
            const json = await IOUtils.readJSON(filePath); // returns Promise<any>
            debug(`readObjectFromJSONFile -- Returned from IOUtils.readJSON() - filePath="${filePath}"`);
          } catch (error) {
            caught(error, "readObjectFromJSONFile -- FILE SYSTEM ERROR", `Calling IOUtils.readJSON() on File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- Error reading File "${fileName}" at "${filePath}"`);
          }

          if (! json) { // MABXXX???
            throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- Failed to read data from File "${fileName}" at "${filePath}"`);
          }

          debug(`readObjectFromJSONFile -- parsing JSON - filePath="${filePath}"`);
          try {
            const obj = JSON.parse(json);
            debug(`readObjectFromJSONFile -- parsed JSON - returning obj - filePath="${filePath}" (typeof obj)=${typeof obj}`);
            return obj;
          } catch (error) {
            caught(error, `readObjectFromJSONFile -- Calling JSON.parse() on File at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- Failed to parse JSON data from File "${fileName}" at "${filePath}"`);
          }
        },



        // returns unsigned long long
        async writeFile(extensionId, fileName, data, writeMode) {
          if (! checkExtensionId(extensionId)) {
            debug(`writeFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.writeFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (! checkFileName(fileName)) {
            debug(`writeFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.writeFile -- fileName is invalid: "${fileName}"`);
          }

          if (typeof data !== 'string') {
            debug(`writeFile -- data parameter is not a String: (typeof data)='${(typeof data)}'`);
            throw new ExtensionError(`BrokerFileSystem.writeFile -- data parameter is not a String: (typeof data)='${(typeof data)}'`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkPathName(filePath)) {
            debug(`writeFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.writeFile -- filePath is invalid: "${filePath}"`);
          }

          if (! writeMode) {
            writeMode = 'overwrite';
          } else if (writeMode === 'replace') {
            writeMode = 'overwrite';
          } else if (! checkWriteMode(writeMode)) {
            debug(`writeFile -- Invalid 'writeMode' parameter': "${writeMode}"`);
            throw new ExtensionError(`BrokerFileSystem.writeFile -- Invalid 'writeMode' parameter: "${writeMode}"`);
          }

          switch (writeMode) {
            case 'append': { // write would fail if the file does NOT exist
              var exists;
              try {
                exists = await IOUtils.exists(filePath); // returns Promise<boolean>
              } catch (error) {
                caught(error, "writeFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on File "${fileName}" at "${filePath}"`);
                throw new ExtensionError(`BrokerFileSystem.writeFile -- Error checking existence of File "${fileName}" at "${filePath}"`);
              }

              if (! exists) {
                debug(`writeFile -- writeMode="${writeMode}" - file does not exist: "${fileName}"`);
                throw new ExtensionError(`BrokerFileSystem.writeFile -- writeMode="${writeMode}" - file does not exist: "${fileName}"`);
              }
              break;
            }
            case 'create': { // write would fail if the file DOES exist
              var exists;
              try {
                exists = await IOUtils.exists(filePath); // returns Promise<boolean>
              } catch (error) {
                caught(error, "writeFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on File "${fileName}" at "${filePath}"`);
                throw new ExtensionError(`BrokerFileSystem.writeFile -- Error checking existence of File "${fileName}" at "${filePath}"`);
              }

              if (exists) {
                debug(`writeFile -- writeMode="${writeMode}" - file already exists: "${fileName}"`);
                throw new ExtensionError(`BrokerFileSystem.writeFile: writeMode="${writeMode}" - file already exists: "${fileName}"`);
              }
              break;
            }
          }

          const writeOptions = { "mode": writeMode };

          debug(`writeFile -- calling IOUtils.writeUTF8 - filePath="${filePath}"`);
          try {
            const count = await IOUtils.writeUTF8(filePath, data, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "writeFile -- FILE SYSTEM ERROR", `Calling writeUTF8() on File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.writeFile -- Error writing File "${fileName}" at "${filePath}"`);
          }
        },



        // returns unsigned long long
        async replaceFile(extensionId, fileName, data) {
          if (! checkExtensionId(extensionId)) {
            debug(`replaceFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.replaceFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (! checkFileName(fileName)) {
            debug(`replaceFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.replaceFile -- fileName is invalid: "${fileName}"`);
          }

          if (typeof data !== 'string') {
            debug(`replaceFile -- data parameter is not a String: (typeof data)='${(typeof data)}'`);
            throw new ExtensionError(`BrokerFileSystem.replaceFile -- data parameter is not a String: (typeof data)='${(typeof data)}'`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkPathName(filePath)) {
            debug(`replaceFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.replaceFile -- filePath is invalid: "${filePath}"`);
          }

          const writeOptions = { "mode": 'overwrite' };

          debug(`replaceFile -- calling IOUtils.writeUTF8 - filePath="${filePath}"`);
          try {
            const count = await IOUtils.writeUTF8(filePath, data, writeOptions); // returns Promise<unsigned long long>
            return count;
          } catch (error) {
            caught(error, "replaceFile -- FILE SYSTEM ERROR", `Calling writeUTF8() on File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.replaceFile -- Error writing File "${fileName}" at "${filePath}"`);
          }
        },



        // returns unsigned long long
        async appendToFile(extensionId, fileName, data) {
          if (! checkExtensionId(extensionId)) {
            debug(`appendToFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.appendToFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (! checkFileName(fileName)) {
            debug(`appendToFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.appendToFile -- fileName is invalid: "${fileName}"`);
          }

          if (typeof data !== 'string') {
            debug(`appendToFile -- data parameter is not a String: (typeof data)='${(typeof data)}'`);
            throw new ExtensionError(`BrokerFileSystem.appendToFile -- data parameter is not a String: (typeof data)='${(typeof data)}'`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkPathName(filePath)) {
            debug(`appendToFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.appendToFile -- filePath is invalid: "${filePath}"`);
          }

          const writeOptions = { "mode": 'appendOrCreate' };

          debug(`appendToFile -- calling IOUtils.writeUTF8 - filePath="${filePath}"`);
          try {
            const count = await IOUtils.writeUTF8(filePath, data, writeOptions); // returns Promise<unsigned long long>
            return count;
          } catch (error) {
            caught(error, "appendToFile -- FILE SYSTEM ERROR", `Calling writeUTF8() on File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.appendToFile -- Error writing File "${fileName}" at "${filePath}"`);
          }
        },



        // returns unsigned long long
        async writeJSONFile(extensionId, fileName, json, writeMode) {
          if (! checkExtensionId(extensionId)) {
            debug(`writeJSONFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.writeJSONFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (! checkFileName(fileName)) {
            debug(`writeJSONFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.writeJSONFile -- fileName is invalid: "${fileName}"`);
          }

          if (typeof json !== 'string') {
            debug(`writeJSONFile -- json parameter is not a String: "${typeof json}"`);
            throw new ExtensionError(`BrokerFileSystem.writeJSONFile -- json parameter is not a String: "${typeof json}"`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkPathName(filePath)) {
            debug(`writeJSONFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.writeJSONFile -- filePath is invalid: "${filePath}"`);
          }

          if (! writeMode) {
            writeMode = 'overwrite';
          } else if (writeMode === 'replace') {
            writeMode = 'overwrite';
          } else if (! checkWriteMode(writeMode)) {
            debug(`writeJSONFile -- Invalid 'writeMode' parameter': "${writeMode}"`);
            throw new ExtensionError(`BrokerFileSystem.writeJSONFile -- Invalid 'writeMode' parameter: "${writeMode}"`);
          }

          switch (writeMode) {
            case 'append':
            case 'appendOrCreate':
              debug(`writeJSONFile -- Unsupported 'writeMode' parameter' for JSON: "${writeMode}"`);
              throw new ExtensionError(`BrokerFileSystem.writeJSONFile -- Unsupported 'writeMode' parameter for JSON: "${writeMode}"`);
            case 'create': { // write would fail if the file DOES exist
              var exists;
              try {
                exists = await IOUtils.exists(filePath); // returns Promise<boolean>
              } catch (error) {
                caught(error, "writeJSONFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on File "${fileName}" at "${filePath}"`);
                throw new ExtensionError(`BrokerFileSystem.writeJSONFile -- Error checking existence of File "${fileName}" at "${filePath}"`);
              }

              if (exists) {
                debug(`writeJSONFile -- writeMode="${writeMode}" - file already exists: "${fileName}"`);
                throw new ExtensionError(`BrokerFileSystem.writeJSONFile: writeMode="${writeMode}" - file already exists: "${fileName}"`);
              }
              break;
            }
          }

          const writeOptions = { "mode": writeMode };

          debug(`writeJSONFile -- calling IOUtils.writeJSON - filePath="${filePath}"`);
          try {
            const count = await IOUtils.writeJSON(filePath, json, writeOptions); // returns Promise<unsigned long long>
            return count;
          } catch (error) {
            caught(error, "writeJSONFile -- FILE SYSTEM ERROR", `Calling writeJSON() on File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.writeJSONFile -- Error writing File "${fileName}" at "${filePath}"`);
          }
        },



        // returns unsigned long long
        async writeObjectToJSONFile(extensionId, fileName, object, writeMode) {
          if (! checkExtensionId(extensionId)) {
            debug(`writeObjectToJSONFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (! checkFileName(fileName)) {
            debug(`writeObjectToJSONFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile -- fileName is invalid: "${fileName}"`);
          }

          if (typeof object !== 'object') {
            debug(`writeObjectToJSONFile -- object parameter is not an object: "${typeof object}"`);
            throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile -- object parameter is not an object: "${typeof object}"`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkPathName(filePath)) {
            debug(`writeObjectToJSONFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile -- filePath is invalid: "${filePath}"`);
          }

          if (! writeMode) {
            writeMode = 'overwrite';
          } else if (writeMode === 'replace') {
            writeMode = 'overwrite';
          } else if (! checkWriteMode(writeMode)) {
            debug(`writeObjectToJSONFile -- Invalid 'writeMode' parameter': "${writeMode}"`);
            throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile -- Invalid 'writeMode' parameter: "${writeMode}"`);
          }

          switch (writeMode) {
            case 'append':
            case 'appendOrCreate':
              debug(`writeObjectToJSONFile -- Unsupported 'writeMode' parameter' for JSON: "${writeMode}"`);
              throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile -- Unsupported 'writeMode' parameter for JSON: "${writeMode}"`);
            case 'create': { // write would fail if the file DOES exist
              var exists;
              try {
                exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
              } catch (error) {
                caught(error, "writeObjectToJSONFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on Item "${fileName}" at "${filePath}"`);
                throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile -- Error checking existence of Item "${fileName}" at "${filePath}"`);
              }

              if (exists) {
                debug(`writeObjectToJSONFile -- writeMode="${writeMode}" - file already exists: "${fileName}"`);
                throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile: writeMode="${writeMode}" - file already exists: "${fileName}"`);
              }
              break;
            }
          }

          let json;
          try {
            json = JSON.stringify(object);
          } catch (error) {
            caught(error, `writeObjectToJSONFile -- Callilng JSON.stringify() - Converting data object to JSON String for File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile: Error Converting data object to JSON String for File "${fileName} at "${filePath}""`);
          }

          const writeOptions = { "mode": writeMode };

          debug(`writeObjectToJSONFile -- calling IOUtils.writeObjectToJSON - filePath="${filePath}"`);
          try {
            const count = await IOUtils.writeJSON(filePath, json, writeOptions); // returns Promise<unsigned long long>
            return count;
          } catch (error) {
            caught(error, "writeObjectToJSONFile -- FILE SYSTEM ERROR", `Calling writeJSON() for File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile -- Error writing File "${fileName}" at "${filePath}"`);
          }
        },



        // returns boolean
        async deleteFile(extensionId, fileName) { /* MUST BE A REGULAR FILE */
          if (! checkExtensionId(extensionId)) {
            debug(`deleteFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (! checkFileName(fileName)) {
            debug(`deleteFile -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteFile -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkPathName(filePath)) {
            debug(`deleteFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteFile -- filePath is invalid: "${filePath}"`);
          }

          debug(`deleteFile -- calling IOUtils.exists - filePath="${filePath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(filePath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "deleteFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteFile -- Error checking existence of File "${fileName}" at "${filePath}"`);
          }

          if (! exists) {
            // MABXXX AND??? THROW INSTEAD OF JUST RETURNING false BELOW???
            // MABXXX this should be controlled by a parameter
          } else {
            debug(`deleteFile -- calling IOUtils.stat - filePath="${filePath}"`);
            let fileInfo;
            try {
              fileInfo = await IOUtils.stat(filePath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "deleteFile -- FILE SYSTEM ERROR", `Calling stat() on Item "${itemName}" at "${itemPath}"`);
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`BrokerFileSystem.deleteFile -- Error getting FileInfo for Item "${fileName}" at "${filePath}"`);
              }
            }

            if (! fileInfo) {
              debug(`deleteFile --  Unable to get file type for File "${fileName}" at "${filePath}" - is it a Regular File?`);
              throw new ExtensionError(`BrokerFileSystem.deleteFile -- Unable to get file type for File "${fileName}" at "${filePath}" - is it a Regular File?`);

            } else if (fileInfo.type !== 'regular') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.deleteFile -- File "${fileName}" at "${filePath}" is not a Regular File`);

            } else {
              debug(`deleteFile -- calling IOUtils.remove() - filePath="${filePath}"`);
              try {
                await IOUtils.remove(filePath, {"ignoreAbsent": true, "recursive": false, "retryReadOnly": true}); // returns Promise<undefined> // NOTE: ignoreAbsent

              } catch (error) {
                caught(error, "deleteFile -- FILE SYSTEM ERROR", `Calling IOUtils.remove() on File "${fileName}" at "${filePath}"`);
                throw new ExtensionError(`BrokerFileSystem.deleteFile -- Error deleting File "${fileName}" at "${filePath}"`);
              }

              // MABXXX this should be controlled by a parameter
              debug(`deleteFile -- calling IOUtils.exists() to make sure delete happened - filePath="${filePath}"`);
              try {
                const existsAfterDelete = await IOUtils.exists(filePath); // returns Promise<boolean> // MABXXX try/catch
                return ! existsAfterDelete;
              } catch (error) {
                caught(error, "deleteFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on File "${fileName}" at "${filePath}"`);
                throw new ExtensionError(`BrokerFileSystem.deleteFile -- Making sure of deletion of File "${fileName}" at "${filePath}"`);
              }
            }
          }

          return false; // MABXXX maybe should throw instead
        },



        // returns boolean
        async deleteDirectory(extensionId, directoryName, recursive) { /* MUST BE A DIRECTORY */
          if (! checkExtensionId(extensionId)) {
            debug(`deleteDirectory -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- extensionId is invalid: "${extensionId}"`);
          }

          if (directoryName && ! checkDirectoryName(directoryName)) { // directoryName is optional
            debug(`deleteDirectory -- directoryName is invalid: "${directoryName}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- directoryName is invalid: "${directoryName}"`);
          } else if (! directoryName) {
            directoryName = extensionId;
          }

          if (typeof recursive === 'undefined') {
            recursive = false;
          } else if (typeof recursive !== 'boolean') {
            debug(`deleteDirectory -- 'recursive' parameter is not 'boolean': "${typeof recursive}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- 'recursive' parameter is not 'boolean': "${typeof recursive}"`);
          }

          const dirPath = buildPathName(context, extensionId, directoryName);
          if (! checkPathName(dirPath)) {
            debug(`deleteDirectory -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`deleteDirectory -- calling IOUtils.exists - dirPath="${dirPath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "deleteDirectory -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on Item "${directoryName}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Error checking existence of Item "${directoryName}" at "${dirPath}"`);
          }

          if (! exists) {
            // MABXXX AND??? SHOULD THROW INSTEAD OF RETURNING false BELOW???
            // MABXXX this should be controlled by a parameter
          } else {
            debug(`deleteDirectory -- calling IOUtils.stat - dirPath="${dirPath}"`);
            let fileInfo;
            try {
              fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "deleteDirectory -- FILE SYSTEM ERROR", `Calling stat() for Item "${directoryName}" at "${dirPath}"`);
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Error getting information for Item "${directoryName}" at "${dirPath}"`);
              }
            }

            if (! fileInfo) {
              debug(`deleteDirectory --  Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
              throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Unable to get item type for Item "${directoryName}" at "${dirPath}" - is it a Directory?`);

            } else if (fileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Item "${directoryName}" at "${dirPath}" is not a Directory`);

            } else {
              if (! recursive) {
                debug(`deleteDirectory -- calling IOUtils.hasChildren = dirPath="${dirPath}"`);
                let hasChildren
                try {
                  hasChildren = await IOUtils.hasChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
                } catch (error) {
                  caught(error, "deleteDirectory -- FILE SYSTEM ERROR", `Calling IOUtils.hasChildren() for Directory "${directoryName}" at "${dirPath}"`);
                  throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Unable to check if Directory has files for "${directoryName}" at  "${dirPath}"`);
                }

                if (hasChildren) {
                  debug(`deleteDirectory --  Cannot delete Directory "${directoryName}" at "${dirPath}" - it has files`);
                  throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Cannot delete Directory "${directoryName}" at "${dirPath}" - it  has files`);
                }
              }

              try {
                debug(`deleteDirectory -- calling IOUtils.remove - dirPath="${dirPath}"`);
                await IOUtils.remove(dirPath, {"ignoreAbsent": true, "recursive": recursive, "retryReadOnly": true}); // returns Promise<undefined> // NOTE: retryReadOnly
                debug(`deleteDirectory -- calling IOUtils.exists - dirPath="${dirPath}"`);
              } catch (error) {
                caught(error, "deleteDirectory -- FILE SYSTEM ERROR", `Calling IOUtils.remove() for Directory "${directoryName}" at "${dirPath}"`);
                throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Error deleting Directory "${directoryName}" at "${dirPath}"`);
              }

              try {
                const existsAfterDelete = await IOUtils.exists(dirPath); // returns Promise<boolean> // MABXXX try/catch
                return ! existsAfterDelete;
              } catch (error) {
                caught(error, "deleteDirectory -- FILE SYSTEM ERROR", `Calling IOUtils.exists() for Directory "${directoryName}" at "${dirPath}"`);
                throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Making sure of deletion of Directory "${directoryName}" at "${dirPath}"`);
              }
            }
          }

          return false; // MABXXX maybe should throw instead
        },



        // returns boolean
        async makeDirectory(extensionId) {
          if (! checkExtensionId(extensionId)) {
            debug(`makeDirectory -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.makeDirectory -- extensionId is invalid: "${extensionId}"`);
          }

          const dirPath = buildPathName(context, extensionId);
          if (! checkPathName(dirPath)) {
            debug(`makeDirectory -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.makeDirectory -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`makeDirectory -- calling IOUtils.exists - dirPath="${dirPath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "makeDirectory -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on Item "${extensionId}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.makeDirectory -- Error checking existence of Item "${extensionId}" at "${dirPath}"`);
          }

          if (exists) {
            debug(`makeDirectory -- calling IOUtils.stat - dirPath="${dirPath}"`);
            let fileInfo;
            try {
              fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "makeDirectory -- FILE SYSTEM ERROR", `Calling stat() for Item "${itemName}" at "${itemPath}"`);
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`BrokerFileSystem.makeDirectory -- Error getting FileInfo for File "${extensionId}" at "${dirPath}"`);
              }
            }
            if (! fileInfo) {
              debug(`makeDirectory --  Unable to get file type for File "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.makeDirectory-- Unable to get file type for File "${extensionId}" at "${dirPath}"`);
            }

            // MABXXX SHOULD THESE BE VALIDATON ERRORS INSTEAD???????????????
            if (fileInfo.type === 'regular') { // enum FileType { "regular", "directory", "other" };
              debug(`makeDirectory -- Regular File already exists dirPath="${dirPath}"`);
            } else if (fileInfo.type === 'directory') { // enum FileType { "regular", "directory", "other" };
              debug(`makeDirectory -- Directory already exists dirPath="${dirPath}"`);
            } else {
              debug(`makeDirectory -- File System item already exists dirPath="${dirPath}"`);
            }

            return false; // should this be a validation error instead???

          } else {
            debug(`makeDirectory -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
            try {
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: createAncestors, ignoreExisting
              return true;
            } catch (error) {
              caught(error, "makeDirectory -- FILE SYSTEM ERROR", `Calling IOUtils.makeDirectory for  Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.makeDirectory Failed to create Directory "${extensionId}" at "${dirPath}"`);
            }
          }
        },



        // returns an IOUtils.FileInfo or undefined if the file does not exist
        // (MABXXX maybe exception actually WOULD be better than undefined?)
        // (MABXXX maybe list the definition of FileInfo here)
        async getFileInfo(extensionId, itemName) {
          if (! checkExtensionId(extensionId)) { // if itemName were optional could get FileInfo for the extensionID directory
            debug(`getFileInfo -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileInfo -- extensionId is invalid: "${extensionId}"`);
          }

          if (itemName && ! checkFileName(itemName)) { // itemName is optional
            debug(`getFileInfo -- itemName is invalid: "${itemName}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileInfo -- itemName is invalid: "${itemName}"`);
          }

          const itemPath = buildPathName(context, extensionId, itemName);
          if (! checkPathName(itemPath)) {
            debug(`getFileInfo -- itemPath is invalid: "${itemPath}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileInfo -- itemPath is invalid: "${itemPath}"`);
          }

          debug(`getFileInfo -- calling IOUtils.exists - itemPath="${itemPath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(itemPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "getFileInfo -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileInfo -- Error checking existence of File "${fileName}" at "${filePath}"`);
          }

          if (! exists) {
            // MABXXX AND??? THROW INSTEAD OF  RETURNING undefined BELOW???
            // MABXXX this should be controlled by a parameter
          } else {
            try {
              debug(`getFileInfo -- calling IOUtils.stat - itemPath="${itemPath}"`);
              // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              const fileInfo = await IOUtils.stat(itemPath); // returns Promise<FileInfo>
              if (itemName) {
                fileInfo.fileName = itemName;
              } else {
                fileInfo.fileName = extensionId;
              }
              return fileInfo;

            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "getFileInfo -- FILE SYSTEM ERROR", `Calling stat() for File "${itemName}" at "${itemPath}"`);
              if (error.name !== 'NotFoundError') { // sometimes stat() throws NotFoundError even though exists() returns true
                throw new ExtensionError(`BrokerFileSystem.getFileInfo -- Error getting FileInfo for File "${itemName}" at "${itemPath}"`);
              }
            }
          }

          return; // undefined
        },



        // Renames a file
        async renameFile(extensionId, fromFileName, toFileName, overwrite) { // MABXXX THIS SHOULD SIMPLY BE rename()
          if (! checkExtensionId(extensionId)) {
            debug(`renameFile -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.renameFile -- extensionId is invalid: "${extensionId}"`);
          }

          if (! checkFileName(fromFileName)) {
            debug(`renameFile -- fromFileName is invalid: "${fromFileName}"`);
            throw new ExtensionError(`BrokerFileSystem.renameFile -- fromFileName is invalid: "${fromFileName}"`);
          }

          if (! checkFileName(toFileName)) {
            debug(`renameFile -- toFileName is invalid: "${toFileName}"`);
            throw new ExtensionError(`BrokerFileSystem.renameFile -- toFileName is invalid: "${toFileName}"`);
          }

          const fromFilePath = buildPathName(context, extensionId, fromFileName);
          if (! checkPathName(fromFilePath)) {
            debug(`renameFile -- fromFilePath is invalid: "${fromFilePath}"`);
            throw new ExtensionError(`BrokerFileSystem.renameFile -- fromFilePath is invalid: "${fromFilePath}"`);
          }

          const toFilePath = buildPathName(context, extensionId, toFileName);
          if (! checkPathName(toFilePath)) {
            debug(`renameFile -- toFilePath is invalid: "${toFilePath}"`);
            throw new ExtensionError(`BrokerFileSystem.renameFile -- toFilePath is invalid: "${toFilePath}"`);
          }

          debug(`renameFile -- calling IOUtils.exists - fromFilePath="${fromFilePath}"`);
          var fromFileExists
          try {
            fromFileExists= await IOUtils.exists(fromFilePath); // returns Promise<boolean>
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            caught(error, "renameFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() for Item fromFile "${fromFileName}" at "${fromFilePath}"`);
            if (error.name !== 'NotFoundError') { // sometimes stat() throws NotFoundError even though exists() returns true
              throw new ExtensionError(`BrokerFileSystem.renameFile -- Error checking if rename fromFile exists: "${fromFileName}" at "${fromFilePath}"`);
            }
          }

          if (! fromFileExists) {
            throw new ExtensionError(`BrokerFileSystem.renameFile -- fromFile does not exist: "${fromFileName}" at "${fromFilePath}"`);
          }

          debug(`renameFile -- calling IOUtils.stat - fromFilePath="${fromFilePath}"`);
          try {
            // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            const fromFileInfo = await IOUtils.stat(fromFilePath); // returns Promise<FileInfo>
            if (fromFileInfo.type !== 'regular') {
              throw new ExtensionError(`BrokerFileSystem.renameFile -- rename fromFile is not a Regular File: "${fromFileName}" at "${fromFilePath}"`);
            }
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            caught(error, "renameFile -- FILE SYSTEM ERROR", `Calling stat() for Item fromFile "${fromFileName}" at "${fromFilePath}"`);
            if (error.name !== 'NotFoundError') { // sometimes stat() throws NotFoundError even though exists() returns true
              throw new ExtensionError(`BrokerFileSystem.renameFile -- Error getting FileInfo for rename fromFile "${fromFileName}" at "${fromFilePath}"`);
            }
          }

          let toFileOverwrite = false;
          if (typeof overwrite !== 'undefined') { // overwrite is optional and schema.json makes sure it's boolean
            toFileOverwrite = overwrite;
          }

          if (! toFileOverwrite) {
            debug(`renameFile -- calling IOUtils.stat - toFilePath="${toFilePath}"`);
            var toFileExists = false;
            try {
              // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              toFileExists = await IOUtils.exists(toFilePath);
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "renameFile -- FILE SYSTEM ERROR", `Calling IOUtils.exists() for Item toFile "${toFileName}" at "${toFilePath}"`);
              if (error.name !== 'NotFoundError') { // sometimes stat() throws NotFoundError even though exists() returns true
                throw new ExtensionError(`BrokerFileSystem.renameFile -- Error checking if rename toFile exists: "${toFileName}" at "${toFilePath}"`);
              }
            }

            if (toFileExists) {
              throw new ExtensionError(`BrokerFileSystem.renameFile -- rename toFile already exists: "${toFileName}" at "${toFilePath}"`);
            }
          }

          debug(`renameFile -- calling IOUtils.move - fromFilePath="${fromFilePath}" toFilePath="${toFilePath}"`);
          try {
            await IOUtils.move(fromFilePath, toFilePath, { 'overwrite': toFileOverwrite } );
            return true;
          } catch (error) {
            caught(error, "renameFile -- FILE SYSTEM ERROR", `Calling IOUtils.move() from File "${fromFileName}" at "${fromFilePath}" to File "${toFileName}" at "${toFilePath}"`);
            throw new ExtensionError(`BrokerFileSystem.renameFile -- Error renaming from File "${fromFileName}" at "${fromFilePath}" to File "${toFileName}" at "${toFilePath}" `);
          }

          return false;
        },



        // returns array of DOMString, the base names (last components in the paths) of only the (matching) Regular files
        // optional matchGLOB must be a String - schema.json makes sure of this
        // NOTE: If the extension directory does not exist, create it MABXXX BUT WHY??? from before we had makeDirectory()
        async listFiles(extensionId, matchGLOB) {
          if (! checkExtensionId(extensionId)) {
            debug(`listFiles -- extensionId is not valid - it cannot be used as a fileName: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.listFiles -- extensionId is not valid - it cannot be used as a fileName: "${extensionId}"`);
          }

          var matchRegExp;
          if (matchGLOB) {
            if ((typeof matchGLOB) !== 'string') {
              debug(`listFiles -- Invalid 'matchGLOB parameter - it must be 'string': '${(typeof matchGLOB)}'`);
              throw new ExtensionError(`BrokerFileSystem.listFiles -- Invalid 'matchGLOB parameter - it must be 'string': '${(typeof matchGLOB)}'`);
            }
            matchRegExp = globToRegExp(matchGLOB);
          }

          const dirPath = buildPathName(context, extensionId); // notice no fileName parameter
          if (! checkPathName(dirPath)) {
            debug(`listFiles -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.listFiles -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`listFiles -- calling IOUtils.exists - dirPath="${dirPath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "listFiles -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on Item "${extensionId}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.listFiles -- Error checking existence of Item "${extensionId}" at "${dirPath}"`);
          }

          if (exists) {
            debug(`listFiles -- calling IOUtils.stat - dirPath="${dirPath}"`);
            let dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "listFiles -- FILE SYSTEM ERROR", `Calling stat() for Item "${extensionId} at "${dirPath}"`);
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`BrokerFileSystem.listFiles -- Error getting information for Item "${extensionId} at "${dirPath}"`);
              }
            }

            if (! dirFileInfo) {
              throw new ExtensionError(`BrokerFileSystem.listFiles Unable to get file type for Directory "${extensionId}" at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.listFiles Directory "${extensionId}" at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
            }

            debug(`listFiles -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
            var children;
            try {
              children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
            } catch (error) {
              caught(error, "listFiles -- FILE SYSTEM ERROR", `Calling IOUtils.getChildren() for  Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.listFiles -- Error listing files in Directory "${extensionId}" at "${dirPath}"`);
            }

            const fileNames = [];
            if (children) {
              for (const filePath of children) {
                const fileName = PathUtils.filename(filePath);
                if (! matchRegExp || matchRegExp.test(fileName)) {
                  let fileInfo
                  try {
                    fileInfo = await IOUtils.stat(filePath); // returns Promise<FileInfo>
                  } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
                    caught(error, "listFiles -- FILE SYSTEM ERROR", `Calling stat() for Item "${fileName}" at "${filePath}"`);
                    if (error.name !== 'NotFoundError') {
                      throw new ExtensionError(`BrokerFileSystem.listFiles -- Error getting type for Item "${fileName}" at "${dirPath}" - is it a File?`);
                    }
                  }

                  if (! fileInfo) {
                    throw new ExtensionError(`BrokerFileSystem.listFiles Unable to get type for Item "${fileName}" at "${dirPath}" - is it a File?`);
                  } else if (fileInfo.type === 'regular') { // enum FileType { "regular", "directory", "other" };
                    fileNames.push(fileName);
                  }
                }
              }
            }

            return fileNames; // return array of String

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`listFiles -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "listFiles -- FILE SYSTEM ERROR", `Calling IOUtils.makeDirectory() for Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.listFiles -- Failed to create Directory "${extensionId}" at "${dirPath}"`);
            }
          }
        },



        // returns array of FileInfo for only the (matching) Regular Files
        // optional matchGLOB must be a String - schema.json makes sure of this
        // NOTE: If the extension directory does not exist, create it MABXXX BUT WHY??? from before we had makeDirectory()
        async listFileInfo(extensionId, matchGLOB) {
          if (! checkExtensionId(extensionId)) {
            debug(`listFileInfo -- extensionId is not valid - it cannot be used as a fileName: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.listFileInfo -- extensionId is not valid - it cannot be used as a fileName: "${extensionId}"`);
          }

          var matchRegExp;
          if (matchGLOB) {
            if ((typeof matchGLOB) !== 'string') {
              debug(`listFiles -- Invalid 'matchGLOB parameter - it must be 'string': '${(typeof matchGLOB)}'`);
              throw new ExtensionError(`BrokerFileSystem.listFiles -- Invalid 'matchGLOB parameter - it must be 'string': '${(typeof matchGLOB)}'`);
            }
            matchRegExp = globToRegExp(matchGLOB);
          }

          const dirPath = buildPathName(context, extensionId); // notice no fileName parameter
          if (! checkPathName(dirPath)) {
            debug(`listFileInfo -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.listFileInfo -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`listFileInfo -- calling IOUtils.exists - dirPath="${dirPath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "listFileInfo -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on File "${extensionId}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.listFileInfo -- Error checking existence of Item "${extensionId}" at "${dirPath}"`);
          }

          if (exists) {
            debug(`listFileInfo -- calling IOUtils.stat - dirPath="${dirPath}"`);

            let dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "listFileInfo -- FILE SYSTEM ERROR", `Calling stat() for Item "${extensionId}" at "${dirPath}"`);
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`BrokerFileSystem.listFileInfo -- Error getting information for Item "${extensionId}" at "${dirPath}"`);
              }
            }

            if (! dirFileInfo) {
              throw new ExtensionError(`BrokerFileSystem.listFileInfo Unable to get file type for Directory "${extensionId}" at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.listFileInfo Directory "${extensionId}" at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
            }

            debug(`listFileInfo -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
            var children;
            try {
              children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
            } catch (error) {
              caught(error, "listFileInfo -- FILE SYSTEM ERROR", `Calling IOUtils.getChildren() for Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.listFileInfo -- Error listing files in Directory "${extensionId}" at "${dirPath}"`);
            }

            const fileInfo = [];
            if (children) {
              for (const filePath of children) {
                const fileName = PathUtils.filename(filePath);
                if (! matchRegExp || matchRegExp.test(fileName)) {
                  let stat
                  try {
                    stat = await IOUtils.stat(filePath); // returns Promise<FileInfo>
                  } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
                    caught(error, "listFileInfo -- FILE SYSTEM ERROR", `Calling stat() for Item "${fileName}" at "${filePath}"`);
                    if (error.name !== 'NotFoundError') {
                      throw new ExtensionError(`BrokerFileSystem.listFileInfo -- Error getting information for Item "${fileName}" at "${filePath}"`);
                    }
                  }

                  if (! stat) {
                    throw new ExtensionError(`BrokerFileSystem.listFileInfo Unable to get type for Item "${fileName}" at "${filePath}" - is it a File?`);
                  } else if (stat.type === 'regular') { // enum FileType { "regular", "directory", "other" };
                    stat.fileName = fileName; // should be simply 'name'
                    fileInfo.push(stat);
                  }
                }
              }
            }

            return fileInfo; // return array of FileInfo

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`listFileInfo -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "listFileInfo -- FILE SYSTEM ERROR", `Calling IOUtils.makeDirectory() for Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.listFileInfo -- Failed to create Directory "${extensionId}" at "${dirPath}"`);
            }
          }
        },



        // returns array of DOMString, the base names (last components in the paths) of the all (matching) items
        // optional matchGLOB must be a String - schema.json makes sure of this
        // NOTE: If the extension directory does not exist, create it MABXXX BUT WHY??? from before we had makeDirectory()
        async list(extensionId, matchGLOB) {
          if (! checkExtensionId(extensionId)) {
            debug(`list -- extensionId is not valid - it cannot be used as a fileName: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.list -- extensionId is not valid - it cannot be used as a fileName: "${extensionId}"`);
          }

          var matchRegExp;
          if (matchGLOB) {
            if ((typeof matchGLOB) !== 'string') {
              debug(`listFiles -- Invalid 'matchGLOB parameter - it must be 'string': '${(typeof matchGLOB)}'`);
              throw new ExtensionError(`BrokerFileSystem.listFiles -- Invalid 'matchGLOB parameter - it must be 'string': '${(typeof matchGLOB)}'`);
            }
            matchRegExp = globToRegExp(matchGLOB);
          }

          const dirPath = buildPathName(context, extensionId); // notice no fileName parameter
          if (! checkPathName(dirPath)) {
            debug(`list -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.list -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`list -- calling IOUtils.exists - dirPath="${dirPath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "list -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on Item "${extensionId}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.list -- Error checking existence of Item "${extensionId}" at "${dirPath}"`);
          }

          if (exists) {
            debug(`list -- calling IOUtils.stat - dirPath="${dirPath}"`);
            let dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "list -- FILE SYSTEM ERROR", `Calling stat() for Item "${extensionId}" at "${dirPath}"`);
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`BrokerFileSystem.list -- Error getting information for Item "${extensionId}" at "${dirPath}"`);
              }
            }

            if (! dirFileInfo) {
              throw new ExtensionError(`BrokerFileSystem.list Unable to get file type for Directory "${extensionId}" at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.list Directory "${extensionId}" at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
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
              caught(error, "list -- FILE SYSTEM ERROR", `Calling IOUtils.getChildren() for Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.list -- Error listing items in Directory "${extensionId}" at "${dirPath}"`);
            }

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`list -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "list -- FILE SYSTEM ERROR", `Calling IOUtils.makeDirectory() for  Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.list -- Failed to create Directory "${extensionId}" at "${dirPath}"`);
            }
          }
        },



        // returns array of FileInfo for all (matching) items
        // optional matchGLOB must be a String - schema.json makes sure of this
        // NOTE: If the extension directory does not exist, create it MABXXX BUT WHY??? from before we had makeDirectory()
        async listInfo(extensionId, matchGLOB) {
          if (! checkExtensionId(extensionId)) {
            debug(`listInfo -- extensionId is not valid - it cannot be used as a fileName: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.listInfo -- extensionId is not valid - it cannot be used as a fileName: "${extensionId}"`);
          }

          var matchRegExp;
          if (matchGLOB) {
            if ((typeof matchGLOB) !== 'string') {
              debug(`listFiles -- Invalid 'matchGLOB parameter - it must be 'string': '${(typeof matchGLOB)}'`);
              throw new ExtensionError(`BrokerFileSystem.listFiles -- Invalid 'matchGLOB parameter - it must be 'string': '${(typeof matchGLOB)}'`);
            }
            matchRegExp = globToRegExp(matchGLOB);
          }

          const dirPath = buildPathName(context, extensionId); // notice no fileName parameter
          if (! checkPathName(dirPath)) {
            debug(`listInfo -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.listInfo -- dirPath is invalid: "${dirPath}"`);
          }

          debug(`listInfo -- calling IOUtils.exists - dirPath="${dirPath}"`);
          var exists;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "listInfo -- FILE SYSTEM ERROR", `Calling IOUtils.exists() on Item "${extensionId}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.listInfo -- Error checking existence of Item "${extensionId}" at "${dirPath}"`);
          }

          if (exists) {
            debug(`listInfo -- calling IOUtils.stat - dirPath="${dirPath}"`);
            let dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "listInfo -- FILE SYSTEM ERROR", `Calling stat() for Item "${extensionId}" at "${dirPath}"`);
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`BrokerFileSystem.listInfo -- Error getting information for Item "${extensionId}" at "${dirPath}"`);
              }
            }

            if (! dirFileInfo) {
              throw new ExtensionError(`BrokerFileSystem.listInfo Unable to get file type for Directory "${extensionId}" at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.listInfo Directory "${extensionId}" at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
            }

            debug(`listInfo -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
            var children;
            try {
              children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
            } catch (error) {
              caught(error, "listInfo -- FILE SYSTEM ERROR", `Calling IOUtils.getChildren() for Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.listInfo -- Error listing files in Directory "${extensionId}" at "${dirPath}"`);
            }

            const fileInfo = [];
            if (children) {
              for (const filePath of children) {
                const fileName = PathUtils.filename(filePath);
                if (! matchRegExp || matchRegExp.test(fileName)) {
                  let stat
                  try {
                    stat = await IOUtils.stat(filePath); // returns Promise<FileInfo>
                  } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
                    caught(error, "listInfo -- FILE SYSTEM ERROR", `Calling stat() for Item "${fileName}" at "${filePath}"`);
                    if (error.name !== 'NotFoundError') {
                      throw new ExtensionError(`BrokerFileSystem.listInfo -- Error getting information for Item "${fileName}" at "${filePath}"`);
                    }
                  }
                  if (! stat) {
                    throw new ExtensionError(`BrokerFileSystem.listInfo Unable to get file type for File "${fileName}" at "${dirPath}" - is it a File?`);
                  } else {
                    stat.fileName = fileName; // should be simply 'name'
                    fileInfo.push(stat);
                  }
                }
              }
            }

            return fileInfo; // return array of FileInfo

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`listInfo -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "listInfo -- FILE SYSTEM ERROR", `Calling IOUtils.makeDirectory() for Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.listInfo -- Failed to create Directory "${extensionId}" at "${dirPath}"`);
            }
          }
        },



        // returns String
        async getFullPathName(extensionId, itemName) {
          if (! checkExtensionId(extensionId)) {
            debug(`getFullPathName -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.getFullPathName -- extensionId is invalid: "${extensionId}"`);
          }

          if (itemName && ! checkFileName(itemName)) { // itemName is optional
            debug(`getFullPathName -- itemName is invalid: "${itemName}"`);
            throw new ExtensionError(`BrokerFileSystem.getFullPathName -- itemName is invalid: "${itemName}"`);
          }

          return buildPathName(context, extensionId, itemName); // returns String
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
        async getFileSystemPathName() {
          return buildFileSystemPathName();
        },



        // optional 'parameters' parameter must be object - schema.json makes sure of this
        // optional parameters.includeChildInfo must be a boolean - schema.json makes sure of this
        // optional parameters.types must be an array of String - schema.json makes sure of this
        //
        // returns:
        //
        //   { extensionId: {
        //       stats: {
        //                'includeChildInfo':               boolean:          incoming parameter
        //                'types':                          array of string:  incoming parameter (OPTIONAL: only if includeChildInfo is true)
        //                'dirName':                        string:           directory name
        //                'dirPath':                        string:           directory fulle pathName
        //                'children':                       integer:          total number of child items
        //                'regular':                        integer:          number of child items with type 'regular'
        //                'directory':                      integer:          number of child items with type 'directory'
        //                'other':                          integer:          number of child items with type 'other'
        //                'unknown':                        integer:          number of child items with type none of the three above
        //                'error':                          integer:          number of child items whose types could not be determined
        //                'earliestChildCreationTime':      integer:          earliest Creation Time      of all child items (OS-dependent) in MS (undefined if no children)
        //                'latestChildCreationTime':        integer:          latest   Creation Time      of all child items (OS-dependent) in MS (undefined if no children)
        //                'earliestChildLastAccessedTime':  integer:          earliest Last Accessed Time of all child items (OS-dependent) in MS (undefined if no children)
        //                'latestChildLastAccessedTime':    integer:          latest   Last Accessed Time of all child items (OS-dependent) in MS (undefined if no children)
        //                'earliestChildLastModifiedTime':  integer:          earliest Last Modified Time of all child items (OS-dependent) in MS (undefined if no children)
        //                'latestChildLastModifiedTime':    integer:          latest   Last Modified Time of all child items (OS-dependent) in MS (undefined if no children)
        //                'smallestSize':                   integer:          smallest size (bytes) of all child items with type 'regular' (-1 if none)
        //                'largestSize':                    integer:          largest size (bytes) of all child items with type 'regular' (-1 if none)
        //                'totalSize':                      integer:          total of sizes (bytes) of all child items with type 'regular'
        //                [ 'childInfo': ]                  array of object {                 (OPTIONAL: only if includeChildInfo is true)
        //                                                    'name'                string:   item name
        //                                                    'type'                string:   item type - 'regular', 'directory', 'other', 'unknown', 'error'
        //                                                    'path'                string:   item full pathName
        //                                                    'creationTime':       integer:  Creation Time      (OS-dependent) in MS
        //                                                    'lastAccessedTime':   integer:  Last Accessed Time (OS-dependent) in MS
        //                                                    'lastModifiedTime':   integer:  Last Modified Time (OS-dependent) in MS
        //                                                    [ 'size': ]           integer:  file size (bytes) (OPTIONAL: only for items with type 'regular')
        //                                                  }
        //              }
        //       }
        //   }
        async stats(extensionId, parameters) {
          if (! checkExtensionId(extensionId)) { // the ID of the extension for which the call is being made
            debug(`stats -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.stats -- extensionId is invalid: "${extensionId}"`);
          }

          if (parameters !== null && (typeof parameters) !== 'object') {
            debug(`stats -- 'parameters' parameter is not 'object': type='${typeof parameters}'`);
            throw new ExtensionError(`BrokerFileSystem.stats -- 'parameters' parameter is not 'object': type='${typeof parameters}'`);
          }

          var includeChildInfo = parameters?.includeChildInfo;
          if (includeChildInfo == null || (typeof includeChildInfo) === 'undefined') {
            includeChildInfo = false;
          } else if (typeof includeChildInfo !== 'boolean') { // schema.json also vaildates this.
            debug(`stats -- 'parameters.includeChildInfo' parameter is not 'boolean': type='${typeof includeChildInfo}'`);
            throw new ExtensionError(`BrokerFileSystem.stats -- 'parameters.includeChildInfo' parameter is not 'boolean': type='${typeof includeChildInfo}'`);
          }

          var types = parameters?.types;
          if (types === null || (typeof types) === 'undefined') {
            // this is ok
          } else if (! includeChildInfo) {
            debug("stats -- 'parameter.types' parameter is not allowed when includeChildInfo is not 'true'");
            throw new ExtensionError("BrokerFileSystem.stats -- 'parameter.types' parameter is not allowed when includeChildInfo is not 'true'");
          } else if ((typeof types) !== 'object') { // schema.json also validates this.
            debug(`stats -- Invalid 'parameter.types' parameter type - Must be 'object': type='${(typeof types)}'`);
            throw new ExtensionError(`BrokerFileSystem.stats -- Invalid 'parameter.types' parameter type - Must be 'object': type='${(typeof types)}'`);
          } else if (! Array.isArray(types)) { // schema.json also validates this.
            debug("stats -- Invalid 'parameter.types' parameter type - Must be an Array");
            throw new ExtensionError("BrokerFileSystem.stats -- 'Invalid 'parameter.types' parameter type - Must be an Array");
          } else if (types.length < 1) { // schema.json also validates this.
            debug("stats -- Invalid 'parameter.types' Array parameter is empty");
            throw new ExtensionError("BrokerFileSystem.stats -- 'parameter.types' Array parameter is empty");
          } else if (types.length > 3) { // schema.json also validates this.
            debug("stats -- Invalid 'parameter.types' Array parameter has length > 3");
            throw new ExtensionError("BrokerFileSystem.stats -- 'parameter.types' Array parameter has length > 3");
          } else if (! checkStatsItemTypes(types)) { // we don't check for repeats, but schema.json does
            debug("stats -- 'parameter.types' parameter contains an invalid value");
            throw new ExtensionError("BrokerFileSystem.stats -- 'parameter.types' parameter contains an invalid value");
          } else {
            // this is ok
          }

if (true) {
  try { // MABXXX try/catch ???
          const response = await getStatsForDir(context, "stats", extensionId, includeChildInfo, types);
          if (! response) {
            debug(`stats -- Failed to get response from getStatsForDir():  "${extensionId}"`);
            // MABXXX return "error" response instead???
            throw new ExtensionError(`BrokerFileSystem.stats -- Failed to get stats for Extension: "${extensionId}"`);

          } else if (response.error) {
            debug(`stats -- 'error' response from getStatsForDir(): "${response.error}"`);
            return response;

          } else if (response.invalid) {
            debug(`stats -- 'invalid' response from getStatsForDir(): "${response.invalid}"`);
            return response;

          } else if (! response.stats) {
            debug(`stats -- No 'stats' response from getStatsForDir(): "${response.invalid}"`);
            // MABXXX return "error" response instead???
            throw new ExtensionError(`BrokerFileSystem.stats -- Failed to get stats for Extension: "${extensionId}"`);

          } else {
            const result = {};
            result[extensionId] = response.stats;
            return result;
          }
  } catch (error) {
    caught(error, "stats -- UNEXPECTED ERROR", `Extension "${extensionId}"`);
  }
} else {

          const dirPath = buildPathName(context, extensionId);
          if (! checkPathName(dirPath)) {
            throw new ExtensionError(`BrokerFileSystem.stats  -- dirPath is invalid: "${dirPath}"`);
          }

          var exists = false;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "stats -- FILE SYSTEM ERROR", `Calling IOUtils.exists() checking existence of Directory for Extension "${extensionId}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.stats -- Error checking existence of Directory for Extension "${extensionId}" at "${dirPath}"`);
          }

          if (! exists) {
            return {}; //MABXXX
          }

          var dirFileInfo;
          try {
            debug(`stats  -- calling IOUtils.stat - dirPath="${dirPath}"`);
            dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            caught(error, "stats -- FILE SYSTEM ERROR", `Calling stat() checking if Item named for Extension "${extensionId}" at "${dirPath}" is a Directory`);
            if (error.name !== 'NotFoundError') {
              throw new ExtensionError(`BrokerFileSystem.stats  -- Error checking if Item named for Extension "${extensionId}" at "${dirPath}" is a Directory`);
            }
          }

          if (! dirFileInfo) {
            debug(error, "stats -- ERROR", `Unable to get FileInfo for Item named for Extension "${extensionId}" at "${dirPath}", is it a Directory?`);
            throw new ExtensionError(`BrokerFileSystem.stats  -- Error checking if Item named for Extension "${extensionId}" at "${dirPath}" is a Directory`);
          }
          if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
            // MABXXX SHOULD THIS REALLY BE AN ERROR OR JUST EMPTY INFO???
            debug(error, "stats -- ERROR", `Item named for Extension "${extensionId}" at "${dirPath}" is NOT a Directory`);
            throw new ExtensionError(`BrokerFileSystem.stats  -- Error: Item named for Extension "${extensionId}" at "${dirPath}" is NOT a Directory`);
          }

          var children;
          try {
            debug(`stats -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
            children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
          } catch (error) {
            caught(error, "stats -- FILE SYSTEM ERROR", `Calling IOUtils.getChildren() getting children of Directory for Extension "${extensionId}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.stats -- Error getting children of Directory for Extension "${extensionId}" at "${dirPath}"`);
          }

          var   numChildren       = 0;
          var   numRegularFiles   = 0;
          var   numDirs           = 0;
          var   numOtherFiles     = 0;
          var   numUnknown        = 0;
          var   numError          = 0;
          var   smallestSize      = -1; // to indicate first 'regular' item size not yet obtained // should this be undefined when no children?
          var   largestSize       = -1; // to indicate first 'regular' item size not yet obtained // should this be undefined when no children?
          var   totalSize         = 0;                                                            // should this be undefined when no children?

          var   creationTime      = dirFileInfo.creationTime;
          var   lastAccessedTime  = dirFileInfo.lastAccessed;
          var   lastModifiedTime  = dirFileInfo.lastModified;

          var   earliestChildCreationTime;     // undefined when no children
          var   latestChildCreationTime;       // undefined when no children
          var   earliestChildLastAccessedTime; // undefined when no children
          var   latestChildLastAccessedTime;   // undefined when no children
          var   earliestChildLastModifiedTime; // undefined when no children
          var   latestChildLastModifiedTime;   // undefined when no children
          var   childInfo;                     // undefined when no children

          if (children) {
            numChildren                   = children.length;
            earliestChildCreationTime     = -1; // to indicate first child creation time not yet obtained
            latestChildCreationTime       = -1; // to indicate first child creation time not yet obtained
            earliestChildLastAccessedTime = -1; // to indicate first child last accessed time not yet obtained
            latestChildLastAccessedTime   = -1; // to indicate first child last accessed time not yet obtained
            earliestChildLastModifiedTime = -1; // to indicate first child last modified time not yet obtained
            latestChildLastModifiedTime   = -1; // to indicate first child last modified time not yet obtained
            smallestSize                  = -1; // to indicate first child size not yet obtained
            largestSize                   = -1; // to indicate first child size not yet obtained
            totalSize                     = 0;
            childInfo                     = [];

            for (const childPath of children) {
              const childName = PathUtils.filename(childPath);

              var fileInfo
              try {
                fileInfo = await IOUtils.stat(childPath); // returns Promise<FileInfo>
              } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
                caught(error, "stats -- FILE SYSTEM ERROR", `Calling stat() getting FileInfo for Item "${childPath}" for Extension "${extensionId}"`);
                if (error.name !== 'NotFoundError') {
                  throw new ExtensionError(`BrokerFileSystem.stats -- Error getting File Information for Item "${childPath}" for Extension "${extensionId}"`);
                }
              }

              if (! fileInfo) {
                numError++;
                error(`stats -- Unable to get File Information for "${childPath}" for Extension "${extensionId}"`);
                if (includeChildInfo) {
                  const info = {
                    'name': childName,
                    'path': childPath,
                    'type': 'error',
                  };
                  childInfo.push(info);
                }
              } else {
                var info;
                if (includeChildInfo) {
                  info = {
                    'name':             childName,
                    'path':             childPath,
                    'type':             fileInfo.type,
                    'creationTime':     fileInfo.creationTime,
                    'lastAccessedTime': fileInfo.lastAccessed,
                    'lastModifiedTime': fileInfo.lastModified,
                  };
                }

                earliestChildCreationTime     = (earliestChildCreationTime     < 0) ? fileInfo.creationTime : Math.min( fileInfo.creationTime, earliestChildCreationTime     );
                latestChildCreationTime       = (latestChildCreationTime       < 0) ? fileInfo.creationTime : Math.max( fileInfo.creationTime, latestChildCreationTime       );
                earliestChildLastAccessedTime = (earliestChildLastAccessedTime < 0) ? fileInfo.lastAccessed : Math.min( fileInfo.lastAccessed, earliestChildLastAccessedTime );
                latestChildLastAccessedTime   = (latestChildLastAccessedTime   < 0) ? fileInfo.lastAccessed : Math.max( fileInfo.lastAccessed, latestChildLastAccessedTime   );
                earliestChildLastModifiedTime = (earliestChildLastModifiedTime < 0) ? fileInfo.lastModified : Math.min( fileInfo.lastModified, earliestChildLastModifiedTime );
                latestChildLastModifiedTime   = (latestChildLastModifiedTime   < 0) ? fileInfo.lastModified : Math.max( fileInfo.lastModified, latestChildLastModifiedTime   );

                // fileInfo.type:  enum FileType { "regular", "directory", "other" }
                switch (fileInfo.type) {
                  case 'regular': {
                    numRegularFiles++;
                    smallestSize = (smallestSize < 0) ? fileInfo.size : Math.min( fileInfo.size, smallestSize );
                    largestSize  = (largestSize  < 0) ? fileInfo.size : Math.max( fileInfo.size, largestSize  );
                    totalSize += fileInfo.size;
                    if (includeChildInfo && (! types || types.includes('regular'))) {
                      info['size'] = fileInfo.size;
                      childInfo.push(info);
                    }
                    break;
                  }

                  case 'directory': {
                    numDirs++;
                    if (includeChildInfo && (! types || types.includes('directory'))) {
                      childInfo.push(info);
                    }
                    break;
                  }

                  case 'other': {
                    numOtherFiles++;
                    if (includeChildInfo && (! types || types.includes('other'))) {
                      childInfo.push(info);
                    }
                    break;
                  }

                  default: {
                    numUnknown++;
                    error(`stats -- Unknown Type for file "${childPath}" for Extension "${extensionId}": "${fileInfo.type}"`);
                    if (includeChildInfo) {
                      info['type'] = 'unknown';
                      childInfo.push(info);
                    }
                  }
                }
              }
            }
          }

          const stats = {
            'includeChildInfo': includeChildInfo,
            'dirPath':                       dirPath,
            'dirName':                       extensionId,
            'children':                      numChildren,
            'regular':                       numRegularFiles,
            'directory':                     numDirs,
            'other':                         numOtherFiles,
            'unknown':                       numUnknown,
            'error':                         numError,
            'earliestChildCreationTime':     earliestChildCreationTime,
            'latestChildCreationTime':       latestChildCreationTime,
            'earliestChildLastAccessedTime': earliestChildLastAccessedTime,
            'latestChildLastAccessedTime':   latestChildLastAccessedTime,
            'earliestChildLastModifiedTime': earliestChildLastModifiedTime,
            'latestChildLastModifiedTime':   latestChildLastModifiedTime,
            'smallestSize':                  smallestSize,
            'largestSize':                   largestSize,
            'totalSize':                     totalSize,
          };
          if (includeChildInfo) {
            stats.childInfo = childInfo;
            if (types) {
              stats['types'] = types;
            }
          }

          const result = {};
          result[extensionId] = stats;

          return result;
}
        }, // END async stats()



        // returns array of FileInfo for all (matching) items
        // optional matchGLOB must be a String - schema.json makes sure of this
        async XXXfsbListInfo(matchGLOB) {
          const FSB_DIR_NAME = "BrokerFileSystem";
          const dirPath      = buildFileSystemPathName();

          var matchRegExp;
          if (matchGLOB) {
            if ((typeof matchGLOB) !== 'string') {
              debug(`listFiles -- Invalid 'matchGLOB parameter - it must be 'string': '${(typeof matchGLOB)}'`);
              throw new ExtensionError(`BrokerFileSystem.listFiles -- Invalid 'matchGLOB parameter - it must be 'string': '${(typeof matchGLOB)}'`);
            }
            matchRegExp = globToRegExp(matchGLOB);
          }

          debug(`fsbListInfo -- calling IOUtils.exists - dirPath="${dirPath}"`);
          var exists = false;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "fsbListInfo -- FILE SYSTEM ERROR", `Calling IOUtils.exists() Checking for existence of Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Error checking existence of Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
          }

          if (! exists) {
            try {
              debug(`fsbListInfo -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting: true
              return [];

            } catch (error) {
              caught(error, "fsbListInfo -- FILE SYSTEM ERROR", `Calling IOUtils.makeDirectory() to create Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Failed to create Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
            }
          } else {

            debug(`fsbListInfo -- calling IOUtils.stat - dirPath="${dirPath}"`);

            var dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "fsbListInfo -- FILE SYSTEM ERROR", `calling stat() for Item "${FSB_DIR_NAME}" at "${dirPath}"`);
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Error getting information for Item "${FSB_DIR_NAME}" at "${dirPath}"`);
              }
            }
            if (! dirFileInfo) {
              throw new ExtensionError(`BrokerFileSystem.fsbListInfo Unable to get file type for Directory "${FSB_DIR_NAME}" at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.fsbListInfo Directory "${FSB_DIR_NAME}" at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
            }

            debug(`fsbListInfo -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
            var children;
            try {
              children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
            } catch (error) {
              caught(error, "fsbListInfo -- FILE SYSTEM ERROR", `Calling IOUtils.getChildren() for Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Error listing Items in Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
            }

            const fileInfo = [];
            if (children) {
              for (const itemPath of children) {
                const itemName = PathUtils.filename(itemPath);
                if (! matchRegExp || matchRegExp.test(itemName)) {
                  var stat
                  try {
                    stat = await IOUtils.stat(itemPath); // returns Promise<FileInfo>
                  } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
                    caught(error, "fsbListInfo -- FILE SYSTEM ERROR", `Calling stats() for Item "${itemName}" "${itemPath}"`);
                    if (error.name !== 'NotFoundError') {
                      throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Error getting information for Item "${itemName}" "${itemPath}"`);
                    }
                  }

                  if (! stat) {
                    throw new ExtensionError(`BrokerFileSystem.fsbListInfo Unable to get file type for Item "${itemName}" at "${dirPath}" - is it a File?`);
                  } else {
                    stat.fileName = itemName; // should be simply 'name'
                    fileInfo.push(stat);
                  }
                }
              }
            }

            return fileInfo; // return array of FileInfo

          }
        }, // END async XXXfsbListInfo(B)



        // returns array of FileInfo for all (matching) items
        // optional parameters must be object - schema.json makes sure of this
        // optional parameters.matchGLOB must be a String - schema.json makes sure of this
        // optional parameters.types must be an array of String - schema.json makes sure of this
        async fsbListInfo(parameters) {
          const FSB_DIR_NAME = "BrokerFileSystem";
          const matchGLOB    = parameters?.matchGLOB;
          const types        = parameters?.types;
          const dirPath      = buildFileSystemPathName();

          if (parameters !== null && (typeof parameters) !== 'object') {
            debug(`fsbListInfo -- Invalid 'parameters' parameter - it must be 'object': '${(typeof parameters)}'`);
            throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Invalid 'parameters' parameter - it must be 'object': '${(typeof parameters)}'`);
          }

          var matchRegExp;
          if (matchGLOB) {
            if ((typeof matchGLOB) !== 'string') {
              debug(`fsbListInfo -- Invalid 'parameters.matchGLOB' parameter - it must be 'string': '${(typeof matchGLOB)}'`);
              throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Invalid 'parameters.matchGLOB' parameter - it must be 'string': '${(typeof matchGLOB)}'`);
            }
            matchRegExp = globToRegExp(matchGLOB);
          }

          if (types == null || (typeof types) === 'undefined') {
            // this is ok
          } else if ((typeof types) !== 'object') { // schema.json also validates this.
            debug(`fsbListInfo -- Invalid 'parameters.types' parameter type - Must be 'object': type='${(typeof types)}'`);
            throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Invalid 'parameters.types' parameter type - Must be 'object': type='${(typeof types)}'`);
          } else if (! Array.isArray(types)) { // schema.json also validates this.
            debug("fsbListInfo -- Invalid 'parameters.types' parameter type - Must be an Array");
            throw new ExtensionError("BrokerFileSystem.fsbListInfo -- 'Invalid 'parameters.types' parameter type - Must be an Array");
          } else if (types.length < 1) { // schema.json also validates this.
            debug("fsbListInfo -- Invalid 'parameters.types' Array parameter is empty");
            throw new ExtensionError("BrokerFileSystem.fsbListInfo -- 'parameters.types' Array parameter is empty");
          } else if (types.length > 3) { // schema.json also validates this.
            debug("fsbListInfo -- Invalid 'parameters.types' Array parameter has length > 3");
            throw new ExtensionError("BrokerFileSystem.fsbListInfo -- 'parameters.types' Array parameter has length > 3");
          } else if (! checkItemTypes(types)) { // we don't check for repeats, but schema.json does
            debug("fsbListInfo -- 'parameters.types' parameter contains an invalid value");
            throw new ExtensionError("BrokerFileSystem.fsbListInfo -- 'parameters.types' parameter contains an invalid value");
          } else {
            // this is ok
          }

          debug(`fsbListInfo -- calling IOUtils.exists - dirPath="${dirPath}"`);
          var exists = false;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "fsbListInfo -- FILE SYSTEM ERROR", `Calling IOUtils.exists() for Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Error getting information for Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
          }

          if (! exists) {
            debug(`fsbListInfo -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
            try {
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting: true
              return [];

            } catch (error) {
              caught(error, "fsbListInfo -- FILE SYSTEM ERROR", `Calling IOUtils.makeDirectory() for Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Failed to create Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
            }

          } else {

            debug(`fsbListInfo -- calling IOUtils.stat - dirPath="${dirPath}"`);
            var dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "fsbListInfo -- FILE SYSTEM ERROR", `Calling stat() for Item "${FSB_DIR_NAME}" at "${dirPath}"`);
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Error getting information for Item "${FSB_DIR_NAME}" at "${dirPath}"`);
              }
            }

            if (! dirFileInfo) {
              throw new ExtensionError(`BrokerFileSystem.fsbListInfo Unable to get file type for Directory "${FSB_DIR_NAME}" at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.fsbListInfo Directory "${FSB_DIR_NAME}" at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
            }

            debug(`fsbListInfo -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
            var children;
            try {
              children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
            } catch (error) {
              caught(error, "fsbListInfo -- FILE SYSTEM ERROR", `Calling IOUtils.getChildren() for Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Error listing files in Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
            }

            const fileInfo = [];
            if (children) {
              for (const itemPath of children) {
                const itemName = PathUtils.filename(itemPath);
                if (! matchRegExp || matchRegExp.test(itemName)) {
                  var stat
                  try {
                    stat = await IOUtils.stat(itemPath); // returns Promise<FileInfo>
                  } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
                    caught(error, "fsbListInfo -- FILE SYSTEM ERROR", `Calling stat() for item "${itemName}" at "${itemPath}"`);
                    if (error.name !== 'NotFoundError') {
                      throw new ExtensionError(`BrokerFileSystem.fsbListInfo -- Error listing items for Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
                    }
                  }
                  if (! stat) {
                    throw new ExtensionError(`BrokerFileSystem.fsbListInfo Unable to get item type for Item "${itemName}" at "${itemPath}"`);
                  } else {
                    if (! types || types.includes(stat.type)) {
                      fileInfo.push(stat);
                    }
                  }
                }
              }
            }

            return fileInfo; // return array of { 'name': itemName, 'type': type }

          }
        }, // END async fsbListInfo()



        // returns array of { 'name': itemName, 'type': type } for all (matching) items
        // optional parameters must be object - schema.json makes sure of this
        // optional parameters.matchGLOB must be a String - schema.json makes sure of this
        // optional parameters.types must be an array of String - schema.json makes sure of this
        async fsbList(parameters) {
          const FSB_DIR_NAME = "BrokerFileSystem";
          const matchGLOB    = parameters?.matchGLOB;
          const types        = parameters?.types;
          const dirPath      = buildFileSystemPathName();

          if (parameters !== null && (typeof parameters) !== 'object') {
            debug(`fsbList -- Invalid 'parameters' parameter - it must be 'object': '${(typeof parameters)}'`);
            throw new ExtensionError(`BrokerFileSystem.fsbList -- Invalid 'parameters' parameter - it must be 'object': '${(typeof parameters)}'`);
          }

          var matchRegExp;
          if (matchGLOB) {
            if ((typeof matchGLOB) !== 'string') {
              debug(`fsbList -- Invalid 'parameters.matchGLOB' parameter - it must be 'string': '${(typeof matchGLOB)}'`);
              throw new ExtensionError(`BrokerFileSystem.fsbList -- Invalid 'parameters.matchGLOB' parameter - it must be 'string': '${(typeof matchGLOB)}'`);
            }
            matchRegExp = globToRegExp(matchGLOB);
          }

          if (types == null || (typeof types) === 'undefined') {
            // this is ok
          } else if ((typeof types) !== 'object') { // schema.json also validates this.
            debug(`fsbList -- Invalid 'parameters.types' parameter type - Must be 'object': type='${(typeof types)}'`);
            throw new ExtensionError(`BrokerFileSystem.fsbList -- Invalid 'parameters.types' parameter type - Must be 'object': type='${(typeof types)}'`);
          } else if (! Array.isArray(types)) { // schema.json also validates this.
            debug("fsbList -- Invalid 'parameters.types' parameter type - Must be an Array");
            throw new ExtensionError("BrokerFileSystem.fsbList -- 'Invalid 'parameters.types' parameter type - Must be an Array");
          } else if (types.length < 1) { // schema.json also validates this.
            debug("fsbList -- Invalid 'parameters.types' Array parameter is empty");
            throw new ExtensionError("BrokerFileSystem.fsbList -- 'parameters.types' Array parameter is empty");
          } else if (types.length > 3) { // schema.json also validates this.
            debug("fsbList -- Invalid 'parameters.types' Array parameter has length > 3");
            throw new ExtensionError("BrokerFileSystem.fsbList -- 'parameters.types' Array parameter has length > 3");
          } else if (! checkItemTypes(types)) { // we don't check for repeats, but schema.json does
            debug("fsbList -- 'parameters.types' parameter contains an invalid value");
            throw new ExtensionError("BrokerFileSystem.fsbList -- 'parameters.types' parameter contains an invalid value");
          } else {
            // this is ok
          }

          debug(`fsbList -- calling IOUtils.exists - dirPath="${dirPath}"`);
          var exists = false;
          try {
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "fsbList -- FILE SYSTEM ERROR", `Calling IOUtils.exists() for Item "${FSB_DIR_NAME}" at "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.fsbList -- Error checking for existence of Item "${FSB_DIR_NAME}" at "${dirPath}"`);
          }

          if (! exists) {
            try {
              debug(`fsbList -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting: true
              return [];

            } catch (error) {
              caught(error, "fsbList -- FILE SYSTEM ERROR", `Calling IOUtils.makeDirectory() for Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.fsbList -- Failed to create Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
            }
          } else {

            debug(`fsbList -- calling IOUtils.stat - dirPath="${dirPath}"`);
            var dirFileInfo;
            try {
              dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              caught(error, "fsbList -- FILE SYSTEM ERROR", `Calling stat() for Item "${FSB_DIR_NAME}" at "${dirPath}"`);
              if (error.name !== 'NotFoundError') {
                throw new ExtensionError(`BrokerFileSystem.fsbList -- Error listing files for Directory "${FSB_DIR_NAME}" at at "${dirPath}"`);
              }
            }

            if (! dirFileInfo) {
              throw new ExtensionError(`BrokerFileSystem.fsbList Unable to get file type for Directory "${FSB_DIR_NAME}" at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.fsbList Directory "${FSB_DIR_NAME}" at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
            }

            debug(`fsbList -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
            var children;
            try {
              children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
            } catch (error) {
              caught(error, "fsbList -- FILE SYSTEM ERROR", `Calling IOUtils.getChildren() for Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.fsbList -- Error listing files in Directory "${FSB_DIR_NAME}" at "${dirPath}"`);
            }

            const items = [];
            if (children) {
              for (const itemPath of children) {
                const itemName = PathUtils.filename(itemPath);
                if (! matchRegExp || matchRegExp.test(itemName)) {
                  var stat
                  try {
                    stat = await IOUtils.stat(itemPath); // returns Promise<FileInfo>
                  } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
                    caught(error, "fsbList -- FILE SYSTEM ERROR", `Calling stat() for Item "${itemName}" at "${itemPath}"`);
                    if (error.name !== 'NotFoundError') {
                      throw new ExtensionError(`BrokerFileSystem.fsbList -- Error listing items "${FSB_DIR_NAME}" at "${dirPath}"`);
                    }
                  }

                  if (! stat) {
                    throw new ExtensionError(`BrokerFileSystem.fsbList Unable to get item type for Item "${itemName}" at "${itemPath}"`);
                  } else {
                    if (! types || types.includes(stat.type)) {
                      items.push( { 'name': itemName, 'type': stat.type } );
                    }
                  }
                }
              }
            }

            return items; // return array of { 'name': itemName, 'type': type }

          }
        }, // END async fsbList()

      }
    };
  }

};




// MABXXX TO AVOID REDUNDANT CODE, THERE ARE NO VALIDITY CHECKS FOR THESE PARAMETERS: dirName, includeChildInfo, and types.
// MABXXX THEY **MUST** BE VALIDATED BEFORE CALLING!!!
//
// returns:
//
//   { stats: {
//              'includeChildInfo':               boolean:          incoming parameter
//              'types':                          array of string:  incoming parameter (OPTIONAL: only if includeChildInfo is true)
//              'dirName':                        string:           directory name
//              'dirPath':                        string:           directory fulle pathName
//              'children':                       integer:          total number of child items
//              'regular':                        integer:          number of child items with type 'regular'
//              'directory':                      integer:          number of child items with type 'directory'
//              'other':                          integer:          number of child items with type 'other'
//              'unknown':                        integer:          number of child items with type none of the three above
//              'error':                          integer:          number of child items whose types could not be determined
//              'earliestChildCreationTime':      integer:          earliest Creation Time      of all child items (OS-dependent) in MS
//              'latestChildCreationTime':        integer:          latest   Creation Time      of all child items (OS-dependent) in MS
//              'earliestChildLastAccessedTime':  integer:          earliest Last Accessed Time of all child items (OS-dependent) in MS
//              'latestChildLastAccessedTime':    integer:          latest   Last Accessed Time of all child items (OS-dependent) in MS
//              'earliestChildLastModifiedTime':  integer:          earliest Last Modified Time of all child items (OS-dependent) in MS
//              'latestChildLastModifiedTime':    integer:          latest   Last Modified Time of all child items (OS-dependent) in MS
//              'smallestSize':                   integer:          smallest size (bytes) of all child items with type 'regular' (-1 if none)
//              'largestSize':                    integer:          largest size (bytes) of all child items with type 'regular' (-1 if none)
//              'totalSize':                      integer:          total of sizes (bytes) of all child items with type 'regular'
//              [ 'childInfo': ]                  array of object {                 (OPTIONAL: only if includeChildInfo is true)
//                                                  'name'                string:   item name
//                                                  'type'                string:   item type - 'regular', 'directory', 'other', 'unknown', 'error'
//                                                  'path'                string:   item full pathName
//                                                  'creationTime':       integer:  Creation Time      (OS-dependent) in MS
//                                                  'lastAccessedTime':   integer:  Last Accessed Time (OS-dependent) in MS
//                                                  'lastModifiedTime':   integer:  Last Modified Time (OS-dependent) in MS
//                                                  [ 'size': ]           integer:  file size (bytes) (OPTIONAL: only for items with type 'regular')
//                                                }
//            }
//   }
async function getStatsForDir(context, cmd, dirName, includeChildInfo, types) {
  if (! context || (typeof context) !== 'object') {
    error(`BrokerFileSystem.${cmd}`, "-- ERROR: 'context' parameter must be 'object'");
    return ( { 'error': `Internal Error - BrokerFileSystem.${cmd} -- getStatsForDir(): parameter 'context' must be 'object'` } );
  }

  if ((typeof cmd) !== 'string') {
    error(`BrokerFileSystem.${cmd}`, "-- ERROR: 'cmd' parameter must be 'string'");
    return ( { 'error': `Internal Error - BrokerFileSystem.${cmd} -- getStatsForDir(): parameter 'cmd' must be 'string'` } );
  } else if (cmd.length < 1) {
    error(`BrokerFileSystem.${cmd}`, "-- ERROR: 'cmd' parameter has length=0");
    return ( { 'error': `Internal Error - BrokerFileSystem.${cmd} -- getStatsForDir(): parameter 'cmd' has length=0` } );
  }

  const dirPath = buildPathName(context, dirName);
  if (! checkPathName(dirPath)) {
    error(`BrokerFileSystem.${cmd}`, `-- ERROR: PathName for item "${dirName}" is invalid: "${dirPath}"`);
    return ( { 'error': `Internal Error - BrokerFileSystem.${cmd} -- getStatsForDir(): PathName for item "${dirName}" is invalid: "${dirPath}"` } );
  }

  debug(`BrokerFileSystem.${cmd}  -- calling IOUtils.exists - dirPath="${dirPath}"`);
  var exists = false;
  try {
    exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
  } catch (error) {
    caught(error, `BrokerFileSystem.${cmd} -- FILE SYSTEM ERROR`, `Calling IOUtils.exists for Item "${dirName}" at "${dirPath}"`);
    return ( { 'error': `Internal Error - BrokerFileSystem.${cmd} -- getStatsForDir(): Checking existence of Item "${dirName}" at path "${dirPath}"` } );
  }

  if (! exists) {
    error(`BrokerFileSystem.${cmd}`, `-- ERROR: Item "${dirName}" does not exist: "${dirPath}"`);
    return ( { 'error': `Internal Error - BrokerFileSystem.${cmd} -- getStatsForDir(): Item "${dirName}" at path "${dirPath}" does not exist` } );
  }

  var dirFileInfo;
  try {
    debug(`BrokerFileSystem.${cmd} -- calling IOUtils.stat - dirPath="${dirPath}"`);
    dirFileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
  } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
    caught(error, `BrokerFileSystem.${cmd} -- FILE SYSTEM ERROR`, `Calling stat() for Item "${dirName}" at "${dirPath}" is a Directory`);
    if (error.name !== 'NotFoundError') {
      return ( { 'error': `Internal Error - BrokerFileSystem.${cmd} -- getStatsForDir(): Checking if Item "${dirName}" at path "${dirPath}" is a directory` } );
    }
  }

  if (! dirFileInfo) {
    error(`BrokerFileSystem.${cmd}`, `-- ERROR: Failed to get FileInfo to check if item "${dirName}" at "${dirPath}" is a Directory`);
    return ( { 'error': `Internal Error - BrokerFileSystem.${cmd} -- getStatsForDir(): Failed to check if item "${dirName}" at path "${dirPath}" is a directory` } );
  }

  if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
    error(`BrokerFileSystem.${cmd}`, `-- ERROR: Item "${dirName}" at "${dirPath}" is NOT a Directory`);
    return ( { 'error': `Internal Error - BrokerFileSystem.${cmd} -- getStatsForDir(): Item "${dirName}" at path "${dirPath}" is NOT a directory` } );
  }

  var children;
  try {
    debug(`BrokerFileSystem.${cmd} -- calling IOUtils.getChildren - dirPath="${dirPath}"`);
    children = await IOUtils.getChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent: true
  } catch (error) {
    caught(error, `BrokerFileSystem.${cmd} -- FILE SYSTEM ERROR`, `Calling IOUtils.getChildren() for Directory "${dirName}" at path "${dirPath}"`);
    return ( { 'error': `Internal Error - BrokerFileSystem.${cmd} -- getStatsForDir(): Getting children of Directory "${dirName}" at path "${dirPath}"` } );
  }


  var   numChildren      = 0;
  var   numRegularFiles  = 0;
  var   numDirs          = 0;
  var   numOtherFiles    = 0;
  var   numUnknown       = 0;
  var   numError         = 0;
  var   smallestSize     = -1; // to indicate first 'regular' item size not yet obtained
  var   largestSize      = -1; // to indicate first 'regular' item size not yet obtained
  var   totalSize        = 0;

  var   creationTime     = dirFileInfo.creationTime;
  var   lastAccessedTime = dirFileInfo.lastAccessed;
  var   lastModifiedTime = dirFileInfo.lastModified;

  var   earliestChildCreationTime;     // undefined when no children
  var   latestChildCreationTime;       // undefined when no children
  var   earliestChildLastAccessedTime; // undefined when no children
  var   latestChildLastAccessedTime;   // undefined when no children
  var   earliestChildLastModifiedTime; // undefined when no children
  var   latestChildLastModifiedTime;   // undefined when no children
  var   childInfo;                     // undefined when no children

  if (children) {
    numChildren                   = children.length;
    earliestChildCreationTime     = -1; // to indicate first child creation time not yet obtained
    latestChildCreationTime       = -1; // to indicate first child creation time not yet obtained
    earliestChildLastAccessedTime = -1; // to indicate first child last accessed time not yet obtained
    latestChildLastAccessedTime   = -1; // to indicate first child last accessed time not yet obtained
    earliestChildLastModifiedTime = -1; // to indicate first child last modified time not yet obtained
    latestChildLastModifiedTime   = -1; // to indicate first child last modified time not yet obtained
    smallestSize                  = -1; // to indicate first child size not yet obtained
    largestSize                   = -1; // to indicate first child size not yet obtained
    totalSize                     = 0;
    childInfo                     = [];

    for (const childPath of children) {
      const childName = PathUtils.filename(childPath);

      var fileInfo
      try {
        fileInfo = await IOUtils.stat(childPath); // returns Promise<FileInfo>
      } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
        caught(error, `${cmd} -- FILE SYSTEM ERROR`, `Calling stat() for item "${childName}" in Directory "${dirName}" at "${dirPath}"`);
        if (error.name !== 'NotFoundError') {
//        throw new ExtensionError(`BrokerFileSystem.${cmd} -- Error getting File Information for item "${childName}" in Directory "${dirName}" at "${dirPath}"`); // MABXXX
        }
      }

      if (! fileInfo) {
        numError++;
        error(`${cmd} -- Unable to get File Information for item "${childName}" in Directory "${dirName}" at "${dirPath}"`);
        if (includeChildInfo && (! types || types.includes('error'))) {
          const info = {
            'name': childName,
            'type': 'error',
            'path': childPath,
          };
          childInfo.push(info);
        }
//      throw new ExtensionError(`BrokerFileSystem.${cmd} Unable to get File Information for item "${childName}" in Directory "${dirName}" at "${dirPath}"`); // MABXXX
      } else {
        var info;
        if (includeChildInfo) {
          info = {
            'name':             childName,
            'path':             childPath,
            'type':             fileInfo.type,
            'creationTime':     fileInfo.creationTime,
            'lastAccessedTime': fileInfo.lastAccessed,
            'lastModifiedTime': fileInfo.lastModified,
          };
        }

        earliestChildCreationTime     = (earliestChildCreationTime     < 0) ? fileInfo.creationTime : Math.min( fileInfo.creationTime, earliestChildCreationTime     );
        latestChildCreationTime       = (latestChildCreationTime       < 0) ? fileInfo.creationTime : Math.max( fileInfo.creationTime, latestChildCreationTime       );
        earliestChildLastAccessedTime = (earliestChildLastAccessedTime < 0) ? fileInfo.lastAccessed : Math.min( fileInfo.lastAccessed, earliestChildLastAccessedTime );
        latestChildLastAccessedTime   = (latestChildLastAccessedTime   < 0) ? fileInfo.lastAccessed : Math.max( fileInfo.lastAccessed, latestChildLastAccessedTime   );
        earliestChildLastModifiedTime = (earliestChildLastModifiedTime < 0) ? fileInfo.lastModified : Math.min( fileInfo.lastModified, earliestChildLastModifiedTime );
        latestChildLastModifiedTime   = (latestChildLastModifiedTime   < 0) ? fileInfo.lastModified : Math.max( fileInfo.lastModified, latestChildLastModifiedTime   );

        // fileInfo.type:  enum FileType { "regular", "directory", "other" }
        switch (fileInfo.type) {
          case 'regular': {
            numRegularFiles++;
            smallestSize = (smallestSize < 0) ? fileInfo.size : Math.min( fileInfo.size, smallestSize );
            largestSize  = (largestSize  < 0) ? fileInfo.size : Math.max( fileInfo.size, largestSize  );
            totalSize += fileInfo.size;
            if (includeChildInfo && (! types || types.includes('regular'))) {
              info['size'] = fileInfo.size;
              childInfo.push(info);
            }
            break;
          }

          case 'directory': {
            numDirs++;
            if (includeChildInfo && (! types || types.includes('directory'))) {
              childInfo.push(info);
            }
            break;
          }

          case 'other': {
            numOtherFiles++;
            if (includeChildInfo && (! types || types.includes('other'))) {
              childInfo.push(info);
            }
            break;
          }

          default: {
            numUnknown++;
            error(`${cmd} -- Unknown Type for item "${childName}" in Directory "${dirName}" at "${dirPath}": type='${fileInfo.type}'`);
            if (includeChildInfo && (! types || types.includes('unknown'))) {
              info['type'] = 'unknown';
              childInfo.push(info);
            }
          }
        }
      }
    }
  }

  const stats = {
    'includeChildInfo': includeChildInfo,
    'dirPath':                       dirPath,
    'dirName':                       dirName,
    'children':                      numChildren,
    'regular':                       numRegularFiles,
    'directory':                     numDirs,
    'other':                         numOtherFiles,
    'unknown':                       numUnknown,
    'error':                         numError,
    'earliestChildCreationTime':     earliestChildCreationTime,
    'latestChildCreationTime':       latestChildCreationTime,
    'earliestChildLastAccessedTime': earliestChildLastAccessedTime,
    'latestChildLastAccessedTime':   latestChildLastAccessedTime,
    'earliestChildLastModifiedTime': earliestChildLastModifiedTime,
    'latestChildLastModifiedTime':   latestChildLastModifiedTime,
    'smallestSize':                  smallestSize,
    'largestSize':                   largestSize,
    'totalSize':                     totalSize,
  };
  if (includeChildInfo) {
    stats['childInfo'] = childInfo;
    if (types) {
      stats['types'] = types;
    }
  }

  const response = { 'stats': stats };

  return response;
}



function buildFileSystemPathName() {
  return PathUtils.join(PathUtils.profileDir, "BrokerFileSystem");
}



function buildPathName(context, extensionId, itemName) {
  /*
   * Was adding our own Extension ID from context making the PATH TOO LONG???
   *
   * IOUtils.stat was not using the same path as IOUtils.exists ???
   *
   * In getFileInfo(), IOUtils.exists said the file exists, but IOUtils.stat was
   * saying it didn't, throwing an Error that didn't include the Extension ID in
   * the path!!!
   *
   * BUT... I was passing in the same exact String!!!
   *
   * So I replaced this code:
   *   if (itemName) return PathUtils.join(PathUtils.profileDir, "BrokerFileSystem", context.extension.id, extensionId, itemName);
   *   return PathUtils.join(PathUtils.profileDir, "BrokerFileSystem", context.extension.id, extensionId);
   *
   * It seems that IOUtils.stat is REMOVING a component from the path, maybe to
   * make it shorter for some reason, but IOUtils.exists isn't???
   *
   * JUST TOO WEIRD!!!
   */

  if (itemName) return PathUtils.join(PathUtils.profileDir, "BrokerFileSystem", /*context.extension.id,*/ extensionId, itemName);
  return PathUtils.join(PathUtils.profileDir, "BrokerFileSystem", /*context.extension.id,*/ extensionId);
}



/* Must be a String with at least 1 character and <= 255 characters. */
// MABXXX check the individual filename commponents as well???   Windows VS *nix VS ???
function checkPathName(itemPath) {
  return ((typeof itemPath === 'string') && itemPath.length >= 1 && itemPath.length <= 255);
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
 * AND FOR DIRECTORIES:
 * - ..
 *
 * NO MORE THAN *64* CHARACTERS
 */
function checkFileName(itemName) {
  if (typeof itemName !== 'string' || itemName.length < 1 || itemName.length > 64) return false;

  const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
  if (ILLEGAL_CHARS.test(itemName)) return false;

  // should this be windows-only???
  const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  if (RESERVED_NAMES.test(itemName)) return false;

  return true;
}

function checkDirectoryName(dirName) {
  if (typeof dirName !== 'string' || dirName.length < 1 || dirName.length > 64) return false;

  const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
  if (ILLEGAL_CHARS.test(dirName)) return false;

  // should this be windows-only???
  const RESERVED_NAMES = /^(\.\.|con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  if (RESERVED_NAMES.test(dirName)) return false;

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
function checkExtensionId(extensionId) {
  if (typeof extensionId !== 'string' || extensionId.length < 1 || extensionId.length > 64) return false;

  const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g; // will be used as part of a directoryName, so no OS-restricted chars
  if (ILLEGAL_CHARS.test(extensionId)) return false;

  // should this be windows-only???
  const RESERVED_NAMES = /^(\.\.|con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  if (RESERVED_NAMES.test(extensionId)) return false;

  // note: no upper-case
  const LIKE_EMAIL_REGEX = /\A(?=[a-z0-9@.!#$%&'*+/=?^_`{|}~-]{6,254}\z)(?=[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@)[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:(?=[a-z0-9-]{1,63}\.)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?=[a-z0-9-]{1,63}\z)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\z/;

//const ENCLOSED_GUID_REGEX   = /^\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}$/;
//const UNENCLOSED_GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
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



function checkStatsItemTypes(fileTypes) { // we don't check for repeats
  if (! Array.isArray(fileTypes)) return false;

  for (const fileType of fileTypes) {
    if (! checkStatsItemType(fileType)) return false;
  }

  return true;
}

function checkStatsItemType(fileType) {
  if ((typeof fileType) !== 'string') return false;

  switch (fileType) {
    case 'regular':
    case 'directory':
    case 'other':
    case 'uknown':
    case 'error':
      return true;
  }
}



function checkItemTypes(fileTypes) { // we don't check for repeats
  if (! Array.isArray(fileTypes)) return false;

  for (const fileType of fileTypes) {
    if (! checkItemType(fileType)) return false;
  }

  return true;
}

function checkItemType(fileType) {
  if ((typeof fileType) !== 'string') return false;

  switch (fileType) {
    case 'regular':
    case 'directory':
    case 'other':
      return true;
  }

  return false;
}



function globToRegExp(glob) {
  const regexp = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
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
  console.debug("BrokerFileSystem#" + msg, ...info);
}

function debugAlways(...info) {
  const msg = info.shift();
  console.debug("BrokerFileSystem#" + msg, ...info);
}

function error(...info) {
  const msg = info.shift();
  console.error("BrokerFileSystem#" + msg, ...info);
}

function caught(e, ...info) {
  const msg = info.shift();
  console.error( "BrokerFileSystem#" + msg,
                 "\n- error.name:    " + e.name,
                 "\n- error.message: " + e.message,
                 "\n- error.stack:   " + e.stack,
                 "\n- ",
                 ...info
               );
}
