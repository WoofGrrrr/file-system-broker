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
 *   . deleteDirectory - Can delete ONLY the directory for the extensionId. (Cannot make sub-directtories, and FileNames cannot contain path separator characters.)
 *   . makeDirectory - Can make only the directory for the extensionId.  Cannot make sub-directories.
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
        async exists(extensionId, fileName) {
          if (! checkExtensionId(extensionId)) {
            debug(`exists -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.exists -- extensionId is invalid: "${extensionId}"`);
          }

          if (fileName && ! checkFileName(fileName)) { // fileName is optional
            throw new ExtensionError(`BrokerFileSystem.exists -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkFilePath(filePath)) {
            throw new ExtensionError(`BrokerFileSystem.exists -- filePath is invalid: "${filePath}"`);
          }

          try {
            const exists = await IOUtils.exists(filePath); // returns Promise<boolean>
            return exists;
          } catch (error) {
            caught(error, "exists -- FILE SYSTEM ERROR", `checking existence of File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.exist -- Error checking existence of File "${fileName}" at "${filePath}"`);
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
          if (! checkFilePath(filePath)) {
            debug(`isRegularFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.isRegularFile -- filePath is invalid: "${filePath}"`);
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
          if (! checkFilePath(dirPath)) {
            debug(`isDirectory -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.isDirectory -- dirPath is invalid: "${dirPath}"`);
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
          if (! checkFilePath(dirPath)) {
            debug(`hasFiles -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- dirPath is invalid: "${dirPath}"`);
          }

          let exists;
          try {
            debug(`hasFiles -- calling IOUtils.exists - dirPath="${dirPath}"`);
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "hasFiles -- FILE SYSTEM ERROR", `checking if file "${directoryName}" at "${dirPath}" exists`);
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- Error checking if file "${directoryName}" at "${dirPath}" exists`);
          }
          if (! exists) {
            throw new ExtensionError(`BrokerFileSystem.hasFiles -- File "${directoryName}" at "${dirPath}" does not exist`);
          }

          let fileInfo;
          try {
            debug(`hasFiles -- calling IOUtils.stat - dirPath="${dirPath}"`);
            fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>

          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            if (error.name !== 'NotFoundError') {
              caught(error, "hasFiles -- FILE SYSTEM ERROR", `checking if file "${directoryName}" at "${dirPath}" is a Directory`);
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

          try {
            debug(`hasFiles -- calling IOUtils.hasChildren - dirPath="${dirPath}"`);
            const hasChildren = await IOUtils.hasChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<boolean> // NOTE: ignoreAbsent
            debug(`hasFiles -- dirPath="${dirPath}" hasChildren=${hasChildren}`);
            return hasChildren;
          } catch (error) {
            debug(`hasFiles --  Unable to get hasChildren for Directory "${directoryName}" at "${dirPath}"`);
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
          if (! checkFilePath(dirPath)) {
            debug(`getFileCount -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- dirPath is invalid: "${dirPath}"`);
          }

          let exists;
          try {
            debug(`getFileCount -- calling IOUtils.exists - dirPath="${dirPath}"`);
            exists = await IOUtils.exists(dirPath); // returns Promise<boolean>
          } catch (error) {
            caught(error, "getFileCount -- FILE SYSTEM ERROR", `checking if file "${directoryName}" at "${dirPath}" exists`);
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- Error checking if file "${directoryName}" at "${dirPath}" exists`);
          }
          if (! exists) {
            throw new ExtensionError(`BrokerFileSystem.getFileCount -- File "${directoryName}" at "${dirPath}" does not exist`);
          }

          let fileInfo;
          try {
            debug(`getFileCount -- calling IOUtils.stat - dirPath="${dirPath}"`);
            fileInfo = await IOUtils.stat(dirPath); // returns Promise<FileInfo>
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            if (error.name !== 'NotFoundError') {
              caught(error, "getFileCount -- FILE SYSTEM ERROR", `checking if file "${directoryName}" at "${dirPath}" is a Directory`);
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
          if (! checkFilePath(filePath)) {
            debug(`readFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readFile -- filePath is invalid: "${filePath}"`);
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
          if (! checkFilePath(filePath)) {
            debug(`readJSONFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- filePath is invalid: "${filePath}"`);
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
            throw new ExtensionError(`BrokerFileSystem.readJSONFile -- Error reading File "${fileName}" at "${filePath}"`);
          }

          throw new ExtensionError(`BrokerFileSystem.readFile -- File "${fileName}" at "${filePath}" does not exist`);
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
          if (! checkFilePath(filePath)) {
            debug(`readObjectFromJSONFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- filePath is invalid: "${filePath}"`);
          }

          try {
            debug(`readObjectFromJSONFile -- calling IOUtils.exists - filePath="${filePath}"`);
            const exists = await IOUtils.exists(filePath); // returns Promise<boolean>
            if (! exists) {
              throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- File "${fileName}" at "${filePath}" does not exist`);
            } else {
              debug(`readObjectFromJSONFile -- calling IOUtils.readJSON - filePath="${filePath}"`);
              const json = await IOUtils.readJSON(filePath); // returns Promise<any>
              debug(`readObjectFromJSONFile -- returned from IOUtils.readJSON - filePath="${filePath}"`);

              try {
                debug(`readObjectFromJSONFile -- parsing JSON - filePath="${filePath}"`);
                const obj = JSON.parse(json);
                debug(`readObjectFromJSONFile -- parsed JSON - returning obj - filePath="${filePath}" (typeof obj)=${typeof obj}`);
                return obj;

              } catch (error) {
                caught(error, `readObjectFromJSONFile -- JSON.parse() failed: "${filePath}"`);
                throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- Failed to parse JSON: "${filePath}"`);
              }
            }

          } catch (error) {
            caught(error, "readObjectFromJSONFile -- FILE SYSTEM ERROR", `reading File "${fileName}" at "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- Error reading File "${fileName}" at "${filePath}"`);
          }

          // Until recently, all other paths except the "else" part of "if (exists)" had a return or a throw, so only "not exists" would get to here.
          // But I just changed to "if (! exists) {} else {}".  Nothing should get to here.
          throw new ExtensionError(`BrokerFileSystem.readObjectFromJSONFile -- File "${fileName}" at "${filePath}" does not exist`);
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
          if (! checkFilePath(filePath)) {
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
              const exists = await IOUtils.exists(filePath); // returns Promise<boolean> // not catching
              if (! exists) {
                debug(`writeFile -- writeMode="${writeMode}" - file does not exist: "${fileName}"`);
                throw new ExtensionError(`BrokerFileSystem.writeFile -- writeMode="${writeMode}" - file does not exist: "${fileName}"`);
              }
              break;
            }
            case 'create': { // write would fail if the file DOES exist
              const exists = await IOUtils.exists(filePath); // returns Promise<boolean> // not catching
              if (exists) {
                debug(`writeFile -- writeMode="${writeMode}" - file already exists: "${fileName}"`);
                throw new ExtensionError(`BrokerFileSystem.writeFile: writeMode="${writeMode}" - file already exists: "${fileName}"`);
              }
              break;
            }
          }

          const writeOptions = { "mode": writeMode };

          try {
            debug(`writeFile -- calling IOUtils.writeUTF8 - filePath="${filePath}"`);
            const count = await IOUtils.writeUTF8(filePath, data, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "writeFile -- FILE SYSTEM ERROR", `writing File "${fileName}" at "${filePath}"`);
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
          if (! checkFilePath(filePath)) {
            debug(`replaceFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.replaceFile -- filePath is invalid: "${filePath}"`);
          }

          const writeOptions = { "mode": 'overwrite' };

          try {
            debug(`replaceFile -- calling IOUtils.writeUTF8 - filePath="${filePath}"`);
            const count = await IOUtils.writeUTF8(filePath, data, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "replaceFile -- FILE SYSTEM ERROR", `writing File "${fileName}" at "${filePath}"`);
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
          if (! checkFilePath(filePath)) {
            debug(`appendToFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.appendToFile -- filePath is invalid: "${filePath}"`);
          }

          const writeOptions = { "mode": 'appendOrCreate' };

          try {
            debug(`appendToFile -- calling IOUtils.writeUTF8 - filePath="${filePath}"`);
            const count = await IOUtils.writeUTF8(filePath, data, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "appendToFile -- FILE SYSTEM ERROR", `writing File "${fileName}" at "${filePath}"`);
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
          if (! checkFilePath(filePath)) {
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
              const exists = await IOUtils.exists(filePath); // returns Promise<boolean> // not catching
              if (exists) {
                debug(`writeJSONFile -- writeMode="${writeMode}" - file already exists: "${fileName}"`);
                throw new ExtensionError(`BrokerFileSystem.writeJSONFile: writeMode="${writeMode}" - file already exists: "${fileName}"`);
              }
              break;
            }
          }

          const writeOptions = { "mode": writeMode };

          try {
            debug(`writeJSONFile -- calling IOUtils.writeJSON - filePath="${filePath}"`);
            const count = await IOUtils.writeJSON(filePath, json, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "writeJSONFile -- FILE SYSTEM ERROR", `writing File "${fileName}" at "${filePath}"`);
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
          if (! checkFilePath(filePath)) {
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
              const exists = await IOUtils.exists(filePath); // returns Promise<boolean> // not catching
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
            caught(error, `writeObjectToJSONFile -- Converting data object to JSON String for "${fileName}":`);
            throw new ExtensionError(`BrokerFileSystem.writeObjectToJSONFile: Error Converting data object to JSON String for "${fileName}"`);
          }

          const writeOptions = { "mode": writeMode };

          try {
            debug(`writeObjectToJSONFile -- calling IOUtils.writeObjectToJSON - filePath="${filePath}"`);
            const count = await IOUtils.writeJSON(filePath, json, writeOptions); // returns Promise<unsigned long long>
            return count;

          } catch (error) {
            caught(error, "writeObjectToJSONFile -- FILE SYSTEM ERROR", `writing File "${fileName}" at "${filePath}"`);
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
          if (! checkFilePath(filePath)) {
            debug(`deleteFile -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteFile -- filePath is invalid: "${filePath}"`);
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
                throw new ExtensionError(`BrokerFileSystem.deleteFile -- Error getting FileInfo for File "${fileName}" at "${filePath}"`);
              }
            }

            if (! fileInfo) {
              debug(`deleteFile --  Unable to get file type for File "${fileName}" at "${filePath}" - is it a Regular File?`);
              throw new ExtensionError(`BrokerFileSystem.deleteFile -- Unable to get file type for File "${fileName}" at "${filePath}" - is it a Regular File?`);

            } else if (fileInfo.type !== 'regular') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.deleteFile -- File "${fileName}" at "${filePath}" is not a Regular File`);

            } else {
              try {
                debug(`deleteFile -- calling IOUtils.remove - filePath="${filePath}"`);
                await IOUtils.remove(filePath, {"ignoreAbsent": true, "recursive": false, "retryReadOnly": true}); // returns Promise<undefined> // NOTE: ignoreAbsent
                const existsAfterDelete = await IOUtils.exists(filePath); // returns Promise<boolean>
                return ! existsAfterDelete;

              } catch (error) {
                caught(error, "deleteFile -- FILE SYSTEM ERROR", `deleting File "${fileName}" at "${filePath}"`);
                throw new ExtensionError(`BrokerFileSystem.deleteFile -- Error deleting File "${fileName}" at "${filePath}"`);
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
          }

          if (typeof recursive === 'undefined') {
            recursive = false;
          } else if (typeof recursive !== 'boolean') {
            debug(`deleteDirectory -- 'recursive' parameter is not 'boolean': "${typeof recursive}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- 'recursive' parameter is not 'boolean': "${typeof recursive}"`);
          }

          const dirPath = buildPathName(context, extensionId, directoryName);
          if (! checkFilePath(dirPath)) {
            debug(`deleteDirectory -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- dirPath is invalid: "${dirPath}"`);
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
                throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Error getting FileInfo for File "${directoryName}" at "${dirPath}"`);
              }
            }

            if (! fileInfo) {
              debug(`deleteDirectory --  Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);
              throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Unable to get file type for File "${directoryName}" at "${dirPath}" - is it a Directory?`);

            } else if (fileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- File "${directoryName}" at "${dirPath}" is not a Directory`);

            } else {
              if (! recursive) {
                let hasChildren
                try {
                  debug(`deleteDirectory -- calling IOUtils.hasChildren = dirPath="${dirPath}"`);
                  hasChildren = await IOUtils.hasChildren(dirPath, {"ignoreAbsent": true}); // returns Promise<sequence<DOMString>> // NOTE: ignoreAbsent
                } catch (error) {
                  debug(`deleteDirectory --  Unable to get hasChildren for Directory "${directoryName}" at "${dirPath}"`);
                  throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Unable to check if Directory has files at "${dirPath}"`);
                }

                if (hasChildren) {
                  debug(`deleteDirectory --  Cannot delete Directory "${directoryName}" at "${dirPath}" - it has files`);
                  throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Cannot delete Directory "${directoryName}" at "${dirPath}" - it  has files`);
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
                throw new ExtensionError(`BrokerFileSystem.deleteDirectory -- Error deleting Directory "${directoryName}" at "${dirPath}"`);
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
          if (! checkFilePath(dirPath)) {
            debug(`makeDirectory -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.makeDirectory -- dirPath is invalid: "${dirPath}"`);
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
              debug(`makeDirectory -- File System object already exists dirPath="${dirPath}"`);
            }

            return false; // should this be a validation error instead???

          } else {
            try {
              debug(`makeDirectory -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: createAncestors, ignoreExisting
              return true;

            } catch (error) {
              caught(error, "makeDirectory -- FILE SYSTEM ERROR", `Failed to create Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.makeDirectory Failed to create Directory "${extensionId}" at "${dirPath}"`);
            }
          }
        },



        // returns an IOUtils.FileInfo or undefined if the file does not exist
        // (MABXXX maybe exception actually WOULD be better than undefined?)
        // (MABXXX maybe list the definition of FileInfo here)
        async getFileInfo(extensionId, fileName) {
          if (! checkExtensionId(extensionId)) { // if fileName were optional could get FileInfo for the extensionID directory
            debug(`getFileInfo -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileInfo -- extensionId is invalid: "${extensionId}"`);
          }

          if (fileName && ! checkFileName(fileName)) { // fileName is optional
            debug(`getFileInfo -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileInfo -- fileName is invalid: "${fileName}"`);
          }

          const filePath = buildPathName(context, extensionId, fileName);
          if (! checkFilePath(filePath)) {
            debug(`getFileInfo -- filePath is invalid: "${filePath}"`);
            throw new ExtensionError(`BrokerFileSystem.getFileInfo -- filePath is invalid: "${filePath}"`);
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
                fileInfo.fileName = extensionId;
              }
              return fileInfo;

            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') { // sometimes stat() throws NotFoundError even though exists() returns true
                throw new ExtensionError(`BrokerFileSystem.getFileInfo -- Error getting FileInfo for File "${fileName}" at "${filePath}"`);
              }
            }
          }

          return; // undefined
        },



        // Renames a file
        async renameFile(extensionId, fromFileName, toFileName, overwrite) {
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
          if (! checkFilePath(fromFilePath)) {
            debug(`renameFile -- fromFilePath is invalid: "${fromFilePath}"`);
            throw new ExtensionError(`BrokerFileSystem.renameFile -- fromFilePath is invalid: "${fromFilePath}"`);
          }

          const toFilePath = buildPathName(context, extensionId, toFileName);
          if (! checkFilePath(toFilePath)) {
            debug(`renameFile -- toFilePath is invalid: "${toFilePath}"`);
            throw new ExtensionError(`BrokerFileSystem.renameFile -- toFilePath is invalid: "${toFilePath}"`);
          }

          debug(`renameFile -- calling IOUtils.exists - fromFilePath="${fromFilePath}"`);
          const fromFileExists = await IOUtils.exists(fromFilePath); // returns Promise<boolean> // not catching
          if (! fromFileExists) {
            throw new ExtensionError(`BrokerFileSystem.renameFile -- fromFile does not exist: "${fromFileName}" at "${fromFilePath}"`);
          }
          
          try {
            debug(`renameFile -- calling IOUtils.stat - fromFilePath="${fromFilePath}"`);
            // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            const fromFileInfo = await IOUtils.stat(fromFilePath); // returns Promise<FileInfo>
            if (fromFileInfo.type !== 'regular') {
              throw new ExtensionError(`BrokerFileSystem.renameFile -- rename fromFile is not a Regular File: "${fromFileName}" at "${fromFilePath}"`);
            }
          } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
            if (error.name !== 'NotFoundError') { // sometimes stat() throws NotFoundError even though exists() returns true
              throw new ExtensionError(`BrokerFileSystem.renameFile -- Error getting FileInfo for rename fromFile "${fromFileName}" at "${fromFilePath}"`);
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
                throw new ExtensionError(`BrokerFileSystem.renameFile -- rename toFile already exists: "${toFileName}" at "${toFilePath}"`);
              }
            } catch (error) { // sometimes stat() throws even though exists() returns true.  I don't know why.  Bugzilla #1962918
              if (error.name !== 'NotFoundError') { // sometimes stat() throws NotFoundError even though exists() returns true
                throw new ExtensionError(`BrokerFileSystem.renameFile -- Error checking if rename toFile exists: "${toFileName}" at "${toFilePath}"`);
              }
            }
          }
          
          try {
            await IOUtils.move(fromFilePath, toFilePath, { 'overwrite': toFileOverwrite } );
            return true;
          } catch (error) {
            throw new ExtensionError(`BrokerFileSystem.renameFile -- Error renaming file: "${fromFileName}" at "${fromFilePath}" to "${toFileName}" at "${toFilePath}" `);
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

          let matchRegExp;
          if (matchGLOB) matchRegExp = globToRegExp(matchGLOB);

          const dirPath = buildPathName(context, extensionId); // notice no fileName parameter
          if (! checkFilePath(dirPath)) {
            debug(`listFiles -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.listFiles -- dirPath is invalid: "${dirPath}"`);
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
                throw new ExtensionError(`BrokerFileSystem.listFiles -- Error listing files at "${dirPath}"`);
              }
            }
            if (! dirFileInfo) {
              throw new ExtensionError(`BrokerFileSystem.listFiles Unable to get file type for Directory "${extensionId}" at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.listFiles Directory "${extensionId}" at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
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
                        throw new ExtensionError(`BrokerFileSystem.listFiles -- Error listing files at "${dirPath}"`);
                      }
                    }
                    if (! fileInfo) {
                      throw new ExtensionError(`BrokerFileSystem.listFiles Unable to get file type for File "${fileName}" at "${dirPath}" - is it a File?`);
                    } else if (fileInfo.type === 'regular') { // enum FileType { "regular", "directory", "other" };
                      fileNames.push(fileName);
                    }
                  }
                }
              }

              return fileNames; // return array of String

            } catch (error) {
              caught(error, "listFiles -- FILE SYSTEM ERROR", `listing files in Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.listFiles -- Error listing files in Directory "${extensionId}" at "${dirPath}"`);
            }

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`listFiles -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "listFiles -- FILE SYSTEM ERROR", `Failed to create Directory "${extensionId}" at "${dirPath}"`);
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

          let matchRegExp;
          if (matchGLOB) matchRegExp = globToRegExp(matchGLOB);

          const dirPath = buildPathName(context, extensionId); // notice no fileName parameter
          if (! checkFilePath(dirPath)) {
            debug(`listFileInfo -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.listFileInfo -- dirPath is invalid: "${dirPath}"`);
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
                throw new ExtensionError(`BrokerFileSystem.listFileInfo -- Error listing files at "${dirPath}"`);
              }
            }
            if (! dirFileInfo) {
              throw new ExtensionError(`BrokerFileSystem.listFileInfo Unable to get file type for Directory "${extensionId}" at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.listFileInfo Directory "${extensionId}" at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
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
                        throw new ExtensionError(`BrokerFileSystem.listFileInfo -- Error listing files at "${dirPath}"`);
                      }
                    }
                    if (! stat) {
                      throw new ExtensionError(`BrokerFileSystem.listFileInfo Unable to get file type for File "${fileName}" at "${dirPath}" - is it a File?`);
                    } else if (stat.type === 'regular') { // enum FileType { "regular", "directory", "other" };
                      stat.fileName = fileName;
                      fileInfo.push(stat);
                    }
                  }
                }
              }

              return fileInfo; // return array of FileInfo

            } catch (error) {
              caught(error, "listFileInfo -- FILE SYSTEM ERROR", `listing files in Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.listFileInfo -- Error listing files in Directory "${extensionId}" at "${dirPath}"`);
            }

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`listFileInfo -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "listFileInfo -- FILE SYSTEM ERROR", `Failed to create Directory "${extensionId}" at "${dirPath}"`);
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

          let matchRegExp;
          if (matchGLOB) matchRegExp = globToRegExp(matchGLOB);

          const dirPath = buildPathName(context, extensionId); // notice no fileName parameter
          if (! checkFilePath(dirPath)) {
            debug(`list -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.list -- dirPath is invalid: "${dirPath}"`);
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
                throw new ExtensionError(`BrokerFileSystem.list -- Error listing items at "${dirPath}"`);
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
              caught(error, "list -- FILE SYSTEM ERROR", `listing items in Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.list -- Error listing items in Directory "${extensionId}" at "${dirPath}"`);
            }

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`list -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "list -- FILE SYSTEM ERROR", `Failed to create Directory "${extensionId}" at "${dirPath}"`);
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

          let matchRegExp;
          if (matchGLOB) matchRegExp = globToRegExp(matchGLOB);

          const dirPath = buildPathName(context, extensionId); // notice no fileName parameter
          if (! checkFilePath(dirPath)) {
            debug(`listInfo -- dirPath is invalid: "${dirPath}"`);
            throw new ExtensionError(`BrokerFileSystem.listInfo -- dirPath is invalid: "${dirPath}"`);
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
                throw new ExtensionError(`BrokerFileSystem.listInfo -- Error listing files at "${dirPath}"`);
              }
            }
            if (! dirFileInfo) {
              throw new ExtensionError(`BrokerFileSystem.listInfo Unable to get file type for Directory "${extensionId}" at "${dirPath}" - is it a Directory?`);
            } else if (dirFileInfo.type !== 'directory') { // enum FileType { "regular", "directory", "other" };
              throw new ExtensionError(`BrokerFileSystem.listInfo Directory "${extensionId}" at "${dirPath}" is not a Directory - FileInfo.type="${dirFileInfo.type}"`);
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
                        throw new ExtensionError(`BrokerFileSystem.listInfo -- Error listing files at "${dirPath}"`);
                      }
                    }
                    if (! stat) {
                      throw new ExtensionError(`BrokerFileSystem.listInfo Unable to get file type for File "${fileName}" at "${dirPath}" - is it a File?`);
                    } else {
                      stat.fileName = fileName;
                      fileInfo.push(stat);
                    }
                  }
                }
              }

              return fileInfo; // return array of FileInfo

            } catch (error) {
              caught(error, "listInfo -- FILE SYSTEM ERROR", `listing files in Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.listInfo -- Error listing files in Directory "${extensionId}" at "${dirPath}"`);
            }

          } else { // MABXXX WHY? Do we still need this now that we have the makeDirectory function?

            try {
              debug(`listInfo -- calling IOUtils.makeDirectory - dirPath="${dirPath}"`);
              await IOUtils.makeDirectory(dirPath, {"createAncestors": true, "ignoreExisting": true}); // returns Promise<undefined> // NOTE: ignoreExisting
              return [];

            } catch (error) {
              caught(error, "listInfo -- FILE SYSTEM ERROR", `Failed to create Directory "${extensionId}" at "${dirPath}"`);
              throw new ExtensionError(`BrokerFileSystem.listInfo -- Failed to create Directory "${extensionId}" at "${dirPath}"`);
            }
          }
        },



        // returns String
        async getFullPathName(extensionId, fileName) {
          if (! checkExtensionId(extensionId)) {
            debug(`getFullPathName -- extensionId is invalid: "${extensionId}"`);
            throw new ExtensionError(`BrokerFileSystem.getFullPathName -- extensionId is invalid: "${extensionId}"`);
          }

          if (fileName && ! checkFileName(fileName)) { // fileName is optional
            debug(`getFullPathName -- fileName is invalid: "${fileName}"`);
            throw new ExtensionError(`BrokerFileSystem.getFullPathName -- fileName is invalid: "${fileName}"`);
          }

          return buildPathName(context, extensionId, fileName); // returns String
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
          return PathUtils.join(PathUtils.profileDir, "BrokerFileSystem");
        },

      }
    };
  }

};



function buildPathName(context, extensionId, fileName) {
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
   *   if (fileName) return PathUtils.join(PathUtils.profileDir, "BrokerFileSystem", context.extension.id, extensionId, fileName);
   *   return PathUtils.join(PathUtils.profileDir, "BrokerFileSystem", context.extension.id, extensionId);
   *
   * It seems that IOUtils.stat is REMOVING a component from the path, maybe to
   * make it shorter for some reason, but IOUtils.exists isn't???
   *
   * JUST TOO WEIRD!!!
   */

  if (fileName) return PathUtils.join(PathUtils.profileDir, "BrokerFileSystem", /*context.extension.id,*/ extensionId, fileName);
  return PathUtils.join(PathUtils.profileDir, "BrokerFileSystem", /*context.extension.id,*/ extensionId);
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
 * AND FOR DIRECTORIES:
 * - ..
 *
 * NO MORE THAN *64* CHARACTERS
 */
function checkFileName(fileName) {
  if (typeof fileName !== 'string' || fileName.length < 1 || fileName.length > 64) return false;

  const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
  if (ILLEGAL_CHARS.test(fileName)) return false;

  // should this be windows-only???
  const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  if (RESERVED_NAMES.test(fileName)) return false;

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
  console.debug("BrokerFileSystem#" + msg, ...info);
}

function debugAlways(...info) {
  const msg = info.shift();
  console.debug("BrokerFileSystem#" + msg, ...info);
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
