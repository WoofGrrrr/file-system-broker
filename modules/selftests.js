////import { Options } from '../modules/options.js';
////import { Logger  } from '../modules/logger.js';
import { formatMsToDateTime12HR } from './utilities.js';


export class FileSystemBrokerSelfTests {
  /* one day I hope to use options to set the logging levels */

  constructor(logger) {
    this.className     = this.constructor.name;

    this.LOG           = false;
    this.DEBUG         = false;

    this.logger        = logger;
////this.fsbOptionsApi = new Options(this.logger);
  }



  log(...info) {
    if (! this.LOG) return;
    this.logger.log(this.className, ...info);
  }

  logAlways(...info) {
    this.logger.logAlways(this.className, ...info);
  }

  debug(...info) {
    if (! this.DEBUG) return;
    this.logger.debug(this.className, ...info);
  }

  debugAlways(...info) {
    this.logger.debugAlways(this.className, ...info);
  }

  error(...info) {
    // always log errors
    this.logger.error(this.className, ...info);
  }

  caught(e, msg, ...info) {
    // always log exceptions
    this.logger.error( this.className,
                       msg,
                       "\n name:    " + e.name,
                       "\n message: " + e.message,
                       "\n stack:   " + e.stack,
                       ...info
                     );
  }



  async runSelfTests() {
    this.debugAlways("\n\n********** TESTING FileSystemBroker **********\n\n");

    /* These Tests Are Avalable:
     *
     *  await this.testExistsCommand(FileName);
     *  await this.testIsRegularFileCommand(FileName);
     *  await this.testIsDirectoryCommand(directoryName);
     *  await this.testHasFilesCommand(directoryName);
     *  await this.testGetFileCountCommand(directoryName);
     *  await this.testWriteFileCommand(fileName, data, [,writeMode]);
     *  await this.testReplaceFileCommand(fileName, data);
     *  await this.testAppendToFileCommand(fileName, data);
     *  await this.testWriteJSONFileCommand(fileName, data, [,writeMode]);
     *  await this.testWriteObjectToJSONFileCommand(fileName, object, [,writeMode]);
     *  await this.testReadFileCommand(fileName);
     *  await this.testReadJSONFileCommand(fileName);
     *  await this.testReadObjectFromJSONFileCommand(fileName);
     *  await this.testGetFileInfoCommand(fileName);
     *  await this.testRenameFileCommand(fileName);
     *  await this.testDeleteFileCommand(fileName);
     *  await this.testDeleteDirectoryCommand(directoryName, recursive);
     *  await this.testMakeDirectoryCommand();
     *  await this.testListFilesCommand( [matchGLOB] );
     *  await this.testListFileInfoCommand( [matchGLOB] );
     *  await this.testListCommand( [matchGLOB] );
     *  await this.testListInfoCommand( [matchGLOB] );
     *  await this.testGetFullPathNameCommand( [fileName] );
     *  await this.testIsValidFileNameCommand(fileName);
     *  await this.testIsValidDirectoryNameCommand(directoryName);
     *  await this.testGetFileSystemPathNameCommand();
     *  await this.testStatsCommand( [ 'parameters': { ['includeChildInfo': boolean] ['types': array of string] } ] );
     *  await this.testFsbListInfoCommand( [ 'parameters': { ['matchGLOB': string] ['types': array of string] } ] );
     *  await this.testFsbListCommand( [ 'parameters': { ['matchGLOB': string] ['types': array of string] } ] );
     *  await this.testUnknownCommand(command);
     */

    await this.testGetFileSystemPathNameCommand("pathaName"                                                            );

////await this.testExistsCommand(          "false"                                                                     ); // "my" directory
////await this.testIsRegularFileCommand(   "error"                                                                     ); // "my" directory - error because fileName is not optional
////await this.testIsDirectoryCommand(     "error"                                                                     ); // "my" directory
////await this.testHasFilesCommand(        "error"                                                                     ); // "my" directory
////await this.testGetFileCountCommand(    "error"                                                                     ); // "my" directory
////await this.testGetFileInfoCommand(     "null"                                                                      ); // "my" directory
    await this.testMakeDirectoryCommand(   "error"                                                                     ); // "my" directory - should already exist
    await this.testExistsCommand(          "true"                                                                      ); // "my" directory
    await this.testIsRegularFileCommand(   "error"                                                                     ); // "my" directory - error because fileName is not optional
    await this.testIsDirectoryCommand(     "true"                                                                      ); // "my" directory
    await this.testHasFilesCommand(        "true"                                                                      ); // "my" directory
    await this.testGetFileCountCommand(    "1"                                                                         ); // "my" directory
    await this.testGetFileInfoCommand(     "FileInfo"                                                                  ); // "my" directory

    await this.testExistsCommand(          "true",                                   "EMPTY"                           ); // should have been created in previous run
    await this.testExistsCommand(          "false",                                  "file1.txt"                       );
    await this.testIsRegularFileCommand(   "false",                                  "file1.txt"                       );
    await this.testIsDirectoryCommand(     "false",                                  "file1.txt"                       );
    await this.testExistsCommand(          "true",                                   "Unused Folder"                   ); // must make it manually - makeDirectory won't make sub-dirs
    await this.testIsRegularFileCommand(   "false",                                  "Unused Folder"                   ); // must make it manually - makeDirectory won't make sub-dirs
    await this.testIsDirectoryCommand(     "true",                                   "Unused Folder"                   ); // must make it manually - makeDirectory won't make sub-dirs
    await this.testGetFileInfoCommand(     "FileInfo",                               "Unused Folder"                   ); // must make it manually - makeDirectory won't make sub-dirs

    await this.testListFilesCommand(       "1 file name - file 'EMPTY'"                                                );
    await this.testListFileInfoCommand(    "1 file name - file 'EMPTY'"                                                );
    await this.testListCommand(            "1 file name - file 'EMPTY'"                                                );
    await this.testListInfoCommand(        "1 file name - file 'EMPTY'"                                                );
    await this.testWriteFileCommand(       "bytesWritten=17",                        "file1.txt", "this is file1.txt"  );
    await this.testWriteFileCommand(       "bytesWritten=17",                        "file2.txt", "this is file2.txt"  );
    await this.testWriteFileCommand(       "bytesWritten=17",                        "file3.txt", "this is file3.txt"  );
    await this.testExistsCommand(          "true",                                   "file1.txt"                       );
    await this.testExistsCommand(          "true",                                   "file2.txt"                       );
    await this.testExistsCommand(          "true",                                   "file3.txt"                       );
    await this.testIsRegularFileCommand(   "true",                                   "file1.txt"                       );
    await this.testIsRegularFileCommand(   "true",                                   "file2.txt"                       );
    await this.testIsRegularFileCommand(   "true",                                   "file3.txt"                       );
    await this.testIsDirectoryCommand(     "false",                                  "file1.txt"                       );
    await this.testIsDirectoryCommand(     "false",                                  "file2.txt"                       );
    await this.testIsDirectoryCommand(     "false",                                  "file3.txt"                       );
    await this.testGetFileInfoCommand(     "FileInfo",                               "file1.txt"                       );
    await this.testGetFileInfoCommand(     "FileInfo",                               "file2.txt"                       );
    await this.testGetFileInfoCommand(     "FileInfo",                               "file3.txt"                       );
    await this.testReadFileCommand(        "data \"this is file1.txt\"",             "file1.txt"                       );
    await this.testReadFileCommand(        "data \"this is file2.txt\"",             "file2.txt"                       );
    await this.testReadFileCommand(        "data \"this is file3.txt\"",             "file3.txt"                       );
    await this.testListFilesCommand(       "4 file names"                                                              );
    await this.testListFileInfoCommand(    "4 files"                                                                   );
    await this.testListFilesCommand(       "1 file name",                            "file1.txt"                       );
    await this.testListFileInfoCommand(    "1 file",                                 "file1.txt"                       );
    await this.testListFilesCommand(       "0 file names",                           "fileX.txt"                       );
    await this.testListFileInfoCommand(    "0 files",                                "fileX.txt"                       );
    await this.testListCommand(            "4 file names"                                                              );
    await this.testListInfoCommand(        "4 files"                                                                   );
    await this.testListCommand(            "1 file name",                            "file1.txt"                       );
    await this.testListInfoCommand(        "1 file",                                 "file1.txt"                       );
    await this.testListCommand(            "0 file names",                           "fileX.txt"                       );
    await this.testListInfoCommand(        "0 files",                                "fileX.txt"                       );
    await this.testHasFilesCommand(        "true"                                                                      ); // "my" directory
    await this.testGetFileCountCommand(    "4"                                                                         ); // "my" directory
    await this.testReplaceFileCommand(     "bytesWritten=17",                        "file1.txt", "this is file1.txt"  );
    await this.testAppendToFileCommand(    "bytesWritten=13",                        "file1.txt", " - more stuff"      );
    await this.testGetFileInfoCommand(     "FileInfo",                               "file1.txt"                       );
    await this.testReadFileCommand(        "data \"this is file1.txt - more stuff\"","file1.txt"                       );

    await this.testDeleteDirectoryCommand( "error, has files",                       undefined, false                  ); // delete my directory, but not the files in it

    await this.testDeleteFileCommand(      "true",                                   "file1.txt"                       );
    await this.testExistsCommand(          "false",                                  "file1.txt"                       );
    await this.testIsRegularFileCommand(   "false",                                  "file1.txt"                       );
    await this.testGetFileInfoCommand(     "error",                                  "file1.txt"                       );
    await this.testReadFileCommand(        "error",                                  "file1.txt"                       );
    await this.testListFilesCommand(       "3 file names"                                                              );
    await this.testListFileInfoCommand(    "3 files"                                                                   );
    await this.testListCommand(            "3 file names"                                                              );
    await this.testListInfoCommand(        "3 files"                                                                   );
    await this.testHasFilesCommand(        "true"                                                                      ); // "my" directory
    await this.testGetFileCountCommand(    "3"                                                                         ); // "my" directory

    await this.testDeleteFileCommand(      "true",                                   "file2.txt"                       );
    await this.testExistsCommand(          "false",                                  "file2.txt"                       );
    await this.testIsRegularFileCommand(   "false",                                  "file2.txt"                       );
    await this.testGetFileInfoCommand(     "error",                                  "file2.txt"                       );
    await this.testReadFileCommand(        "error",                                  "file2.txt"                       );
    await this.testListFilesCommand(       "2 file names"                                                              );
    await this.testListFileInfoCommand(    "2 files"                                                                   );
    await this.testListCommand(            "2 file names"                                                              );
    await this.testListInfoCommand(        "2 files"                                                                   );
    await this.testHasFilesCommand(        "true"                                                                      ); // "my" directory
    await this.testGetFileCountCommand(    "2"                                                                         ); // "my" directory

    await this.testRenameFileCommand(      "true",                                   "file3.txt", "renamed.txt"        );
    await this.testExistsCommand(          "false",                                  "file3.txt"                       );
    await this.testIsRegularFileCommand(   "false",                                  "file3.txt"                       );
    await this.testGetFileInfoCommand(     "error",                                  "file3.txt"                       );
    await this.testReadFileCommand(        "error",                                  "file3.txt"                       );
    await this.testExistsCommand(          "true",                                   "renamed.txt"                     );
    await this.testIsRegularFileCommand(   "true",                                   "renamed.txt"                     );
    await this.testGetFileInfoCommand(     "FileInfo",                               "renamed.txt"                     );
    await this.testReadFileCommand(        "data \"this is file3.txt\"",             "renamed.txt"                     );
    await this.testListFilesCommand(       "2 file names"                                                              );
    await this.testListFileInfoCommand(    "2 files"                                                                   );
    await this.testListCommand(            "2 file names"                                                              );
    await this.testListInfoCommand(        "2 files"                                                                   );
    await this.testHasFilesCommand(        "true"                                                                      ); // "my" directory
    await this.testGetFileCountCommand(    "2"                                                                         ); // "my" directory

    await this.testDeleteDirectoryCommand( "error, has files",                       undefined, false                  ); // delete my directory, but not the files in it
////await this.testDeleteDirectoryCommand( "return true",                            undefined, true                   ); // delete my directory and *ALL* the files in it
////await this.testExistsCommand(          "false"                                                                     ); // "my" directory
    await this.testIsRegularFileCommand(   "error, no fileName"                                                        ); // "my" directory
////await this.testIsDirectoryCommand(     "false"                                                                     ); // "my" directory
////await this.testGetFileInfoCommand(     "null"                                                                      ); // "my" directory
////await this.testHasFilesCommand(        "error, directory does not exist"                                           ); // "my" directory
////await this.testGetFileCountCommand(    "error, directory does not exist"                                           ); // "my" directory

////await this.testMakeDirectoryCommand(   "true"                                                                      ); // "my" directory
    await this.testExistsCommand(          "true"                                                                      ); // "my" directory
    await this.testIsRegularFileCommand(   "error, no fileName"                                                        ); // "my" directory
    await this.testIsDirectoryCommand(     "true"                                                                      ); // "my" directory
    await this.testGetFileInfoCommand(     "FileInfo"                                                                  ); // "my" directory
////await this.testHasFilesCommand(        "false"                                                                     ); // "my" directory
////await this.testGetFileCountCommand(    "0"                                                                         ); // "my" directory

    await this.testWriteFileCommand(       "bytesWritten=0",                         "EMPTY", ""                       );
    await this.testHasFilesCommand(        "true"                                                                      ); // "my" directory
    await this.testGetFileCountCommand(    "1"                                                                         ); // "my" directory

    await this.testGetFullPathNameCommand( "full path name",                         "randomFileName.txt"              );

    await this.testIsValidFileNameCommand( "error",                                  ""                                );
    await this.testIsValidFileNameCommand( "true",                                   "file1.txt"                       );
    await this.testIsValidFileNameCommand( "true",                                   "xxx"                             );
    await this.testIsValidFileNameCommand( "false",                                  "f:le1.txt"                       );
    await this.testIsValidFileNameCommand( "false",                                  "f*le1.txt"                       );

    await this.testIsValidDirectoryNameCommand( "error",                             ""                                );
    await this.testIsValidDirectoryNameCommand( "true",                              "dir1"                            );
    await this.testIsValidDirectoryNameCommand( "true",                              "xxx"                             );
    await this.testIsValidDirectoryNameCommand( "false",                             "d:r1"                            );
    await this.testIsValidDirectoryNameCommand( "false",                             "d*r1"                            );
    await this.testIsValidDirectoryNameCommand( "false",                             ".."                              );

    await this.testStatsCommand(           "object with no childInfo"                                                                      );
    await this.testStatsCommand(           "object with no childInfo",               {'includeChildInfo':false}                            );
    await this.testStatsCommand(           "object with childInfo",                  {'includeChildInfo':true}                             );
    await this.testStatsCommand(           "Object with childInfo for regular",      {'includeChildInfo':true, 'types':['regular']}        );
    await this.testStatsCommand(           "Object with childInfo for directory",    {'includeChildInfo':true, 'types':['directory']}      );
    await this.testStatsCommand(           "invalid",                                {'includeChildInfo':'XXX'}                            );
    await this.testStatsCommand(           "invalid",                                'XXX'                                                 );
    await this.testStatsCommand(           "invalid",                                {'XXX':"YYY"}                                         );
    await this.testStatsCommand(           "invalid",                                {'types': false}                                      );
    await this.testStatsCommand(           "invalid",                                {'types': [false]}                                    );
    await this.testStatsCommand(           "invalid",                                {'types': ['regular']}                                );
    await this.testStatsCommand(           "invalid",                                {'includeChildInfo':true, 'types':false}              );
    await this.testStatsCommand(           "invalid",                                {'includeChildInfo':true, 'types':[false]}            );
    await this.testStatsCommand(           "invalid",                                {'includeChildInfo':true, 'types':['XXX']}            );
    await this.testStatsCommand(           "invalid",                                {'includeChildInfo':true, 'types':['other','other']}  );

    await this.testFsbListInfoCommand(     "array of fileInfo"                                                                             );
    await this.testFsbListInfoCommand(     "array of fileInfo for regular",          {'types':['regular']}                                 );
    await this.testFsbListInfoCommand(     "array of fileInfo for directory",        {'types':['directory']}                               );
    await this.testFsbListInfoCommand(     "array of fileInfo for regular & dir",    {'types':['regular','directory']}                     );
    await this.testFsbListInfoCommand(     "invalid",                                'XXX'                                                 );
    await this.testFsbListInfoCommand(     "invalid",                                {'XXX':"YYY"}                                         );
    await this.testFsbListInfoCommand(     "invalid",                                {'types':'XXX'}                                       );
    await this.testFsbListInfoCommand(     "invalid",                                {'types':[false]}                                     );
    await this.testFsbListInfoCommand(     "invalid",                                {'types':['XXX']}                                     );
    await this.testFsbListInfoCommand(     "invalid",                                {'types':['other','other']}                           );

    await this.testFsbListCommand(         "array of info",                                                                                );
    await this.testFsbListCommand(         "array of info for 'regular'",            {'types':['regular']}                                 );
    await this.testFsbListCommand(         "array of info for 'directory'",          {'types':['directory']}                               );
    await this.testFsbListCommand(         "array of info for regular & directory",  {'types':['regular','directory']}                     );
    await this.testFsbListCommand(         "invalid",                                'XXX'                                                 );
    await this.testFsbListCommand(         "invalid",                                {'XXX':"YYY"}                                         );
    await this.testFsbListCommand(         "invalid",                                {'types':'XXX'}                                       );
    await this.testFsbListCommand(         "invalid",                                {'types':[false]}                                     );
    await this.testFsbListCommand(         "invalid",                                {'types':['XXX']}                                     );
    await this.testFsbListCommand(         "invalid",                                {'types':['other','other']}                           );

    await this.testUnknownCommand(         "error",                                  ""                                );
    await this.testUnknownCommand(         "error",                                  "*"                               );
    await this.testUnknownCommand(         "error",                                  "command"                         );

    this.debugAlways("\n\n********** DONE TESTING FileSystemBroker **********\n\n");
  }



  async sendFSBrokerCommand(command) {
    try {
      this.debug(`sendFSBrokerCommand -- sending command command.command="${command.command}" to Ourself"`);

      const message = { 'Command': command };
      const response = await messenger.runtime.sendMessage(message);

      if (response) {
        this.debug("sendFSBrokerCommand -- Got a Response!!!");
        return response;

      } else {
        this.debug("sendFSBrokerCommand -- GOT NO RESPONSE!!!");
      }

    } catch (error) {
      this.caught(error, "sendFSBrokerCommand !!!!! MESSAGE SEND FAILED !!!!!");
    }
  }


  async testExistsCommand(expecting, fileName) {
    this.debugAlways(`testExistsCommand -- COMMAND exists: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand({ "command": "exists", "fileName": fileName });
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testExistsCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testExistsCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testExistsCommand -- RESPONSE: fileName="${response.fileName}" exists="${response.exists}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testExistsCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testIsRegularFileCommand(expecting, fileName) {
    this.debugAlways(`testIsRegularFileCommand -- COMMAND isRegularFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand({ "command": "isRegularFile", "fileName": fileName });
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testIsRegularFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testIsRegularFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testIsRegularFileCommand -- RESPONSE: fileName="${response.fileName}" isRegularFile="${response.isRegularFile}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testIsRegularFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testIsDirectoryCommand(expecting, directoryName) {
    this.debugAlways(`testIsDirectoryCommand -- COMMAND isDirectory: directoryName="${directoryName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand({ "command": "isDirectory", "directoryName": directoryName });
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testIsDirectoryCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testIsDirectoryCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testIsDirectoryCommand -- RESPONSE: directoryName="${response.directoryName}" isDirectory="${response.isDirectory}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testIsDirectoryCommand: !!!!! directoryName="${directoryName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testHasFilesCommand(expecting, directoryName) {
    this.debugAlways(`testHasFilesCommand -- COMMAND hasFiles: directoryName="${directoryName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand({ "command": "hasFiles", "directoryName": directoryName });
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testHasFilesCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testHasFilesCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testHasFilesCommand -- RESPONSE: directoryName="${response.directoryName}" hasFiles="${response.hasFiles}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testHasFilesCommand: !!!!! directoryName="${directoryName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testGetFileCountCommand(expecting, directoryName) {
    this.debugAlways(`testGetFileCountCommand -- COMMAND getFileCount: directoryName="${directoryName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand({ "command": "getFileCount", "directoryName": directoryName });
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testGetFileCountCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testGetFileCountCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testGetFileCountCommand -- RESPONSE: directoryName="${response.directoryName}" fileCount="${response.fileCount}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testGetFileCountCommand: !!!!! directoryName="${directoryName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testWriteFileCommand(expecting, fileName, data, writeMode) {
    this.debugAlways(`testWriteFileCommand -- COMMAND writeFile: fileName="${fileName}" writeMode="${writeMode}" expecting "${expecting}"`);
    try {
      let response;
      if (writeMode != null && typeof writeMode !== 'undefined') {
        response = await this.sendFSBrokerCommand( { "command": "writeFile", "fileName": fileName, "data": data , "writeMode": writeMode} );
      } else {
        response = await this.sendFSBrokerCommand( { "command": "writeFile", "fileName": fileName, "data": data } );
      }
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testWriteFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testWriteFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testWriteFileCommand -- RESPONSE: fileName="${response.fileName}" bytesWritten="${response.bytesWritten}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testWriteFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testReplaceFileCommand(expecting, fileName, data) {
    this.debugAlways(`testReplaceFileCommand -- COMMAND replaceFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "replaceFile", "fileName": fileName, "data": data } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testReplaceFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testReplaceFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testReplaceFileCommand -- RESPONSE: fileName="${response.fileName}" bytesWritten="${response.bytesWritten}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testReplaceFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testAppendToFileCommand(expecting, fileName, data) {
    this.debugAlways(`testAppendToFileCommand -- COMMAND appendToFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "appendToFile", "fileName": fileName, "data": data } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testAppendToFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testAppendToFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testAppendToFileCommand -- RESPONSE: fileName="${response.fileName}" bytesWritten="${response.bytesWritten}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testAppendToFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testWriteJSONFileCommand(expecting, fileName, data, writeMode) {
    this.debugAlways(`testWriteJSONFileCommand -- COMMAND writeJSONFile: fileName="${fileName}" writeMode="${writeMode}" expecting "${expecting}"`);
    try {
      let response;
      if (writeMode != null && typeof writeMode !== 'undefined') {
        response = await this.sendFSBrokerCommand( { "command": "writeJSONFile", "fileName": fileName, "data": data , "writeMode": writeMode} );
      } else {
        response = await this.sendFSBrokerCommand( { "command": "writeJSONFile", "fileName": fileName, "data": data } );
      }
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testWriteJSONFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testWriteJSONFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testWriteJSONFileCommand -- RESPONSE: fileName="${response.fileName}" bytesWritten="${response.bytesWritten}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testWriteJSONFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testWriteObjectToJSONFileCommand(expecting, fileName, object, writeMode) {
    this.debugAlways(`testWriteObjectToJSONFileCommand -- COMMAND writeObjectToJSONFile: fileName="${fileName}" writeMode="${writeMode}" expecting "${expecting}"`);
    try {
      let response;
      if (writeMode != null && typeof writeMode !== 'undefined') {
        response = await this.sendFSBrokerCommand( { "command": "writeObjectToJSONFile", "fileName": fileName, "object": object , "writeMode": writeMode} );
      } else {
        response = await this.sendFSBrokerCommand( { "command": "writeObjectToJSONFile", "fileName": fileName, "object": object } );
      }
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testWriteObjectToJSONFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testWriteObjectToJSONFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testWriteObjectToJSONFileCommand -- RESPONSE: fileName="${response.fileName}" bytesWritten="${response.bytesWritten}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testWriteObjectToJSONFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testReadFileCommand(expecting, fileName) {
    this.debugAlways(`testReadFileCommand -- COMMAND readFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "readFile", "fileName": fileName } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testReadFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testReadFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testReadFileCommand -- RESPONSE: fileName="${response.fileName}"`);
          this.debugAlways(`testReadFileCommand -- RESPONSE: data="${response.data}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testReadFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testReadJSONFileCommand(expecting, fileName) {
    this.debugAlways(`testReadJSONFileCommand -- COMMAND readJSONFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "readJSONFile", "fileName": fileName } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testReadJSONFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testReadJSONFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testReadJSONFileCommand -- RESPONSE: fileName="${response.fileName}"`);
          this.debugAlways(`testReadJSONFileCommand -- RESPONSE: data="${response.data}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testReadJSONFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testReadObjectFromJSONFileCommand(expecting, fileName) {
    this.debugAlways(`testReadObjectFromJSONFileCommand -- COMMAND readObjectFromJSONFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "readObjectFromJSONFile", "fileName": fileName } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testReadObjectFromJSONFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testReadObjectFromJSONFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testReadObjectFromJSONFileCommand -- RESPONSE: fileName="${response.fileName}"`);
          this.debugAlways("testReadObjectFromJSONFileCommand -- RESPONSE: object:", response.object);
        }
      }
    } catch (error) {
      this.caught(error, `testReadObjectFromJSONFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testGetFileInfoCommand(expecting, fileName) {
    this.debugAlways(`testGetFileInfoCommand -- COMMAND getFileInfo fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "getFileInfo", "fileName": fileName } );
      if (response) { // errors and missing response are already handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testGetFileInfoCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testGetFileInfoCommand -- ERROR: "${response.error}"`);
        } else {
          const fileInfo = response.fileInfo;
          if (! fileInfo) { // this should never happen. FSBroker (currently) returns an error if the file does not exist
            this.debugAlways(`testGetFileInfoCommand -- ERROR: FileSystemBroker returned null for file "${fileName}"`);
          } else {
            this.debugAlways( `testGetFileInfoCommand -- RESPONSE: fileName="${response.fileName}" fileInfo:`
                              + `\n- path="${fileInfo.path}"`
                              + `\n- type="${fileInfo.type}"`
                              + `\n- size="${fileInfo.size}"`
                              + `\n- creationTime="${formatMsToDateTime12HR(fileInfo.creationTime)}"`
                              + `\n- lastAccessed="${formatMsToDateTime12HR(fileInfo.lastAccessed)}"`
                              + `\n- lastModified="${formatMsToDateTime12HR(fileInfo.lastModified)}"`
                              + `\n- permissions="${fileInfo.permissions}"`
                            );
          }
        }
      }
    } catch (error) {
      this.caught(error, `testGetFileInfoCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testRenameFileCommand(expecting, fromFileName, toFileName, overwrite) {
    this.debugAlways(`testRenameFileCommand -- COMMAND renameFile: fromFileName="${fromFileName}" toFileName="${toFileName}" overwrite=${overwrite} expecting "${expecting}"`);
    try {
      var response;
      if (overwrite != null && typeof overwrite !== 'undefined') {
        response = await this.sendFSBrokerCommand( { "command": "renameFile", "fromFileName": fromFileName, "toFileName": toFileName, "overwrite": overwrite } );
      } else {
        response = await this.sendFSBrokerCommand( { "command": "renameFile", "fromFileName": fromFileName, "toFileName": toFileName } );
      }
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testRenameFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testRenameFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testRenameFileCommand -- RESPONSE: fromFileName="${response.fromFileName}" toFileName="${response.toFileName}" renamed="${response.renamed}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testRenameFileCommand: !!!!! fromFileName="${fromFileName}" toFileName="${toFileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testDeleteFileCommand(expecting, fileName) {
    this.debugAlways(`testDeleteFileCommand -- COMMAND deleteFile: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "deleteFile", "fileName": fileName } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testDeleteFileCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testDeleteFileCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testDeleteFileCommand -- RESPONSE: fileName="${response.fileName}" deleted="${response.deleted}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testDeleteFileCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testDeleteDirectoryCommand(expecting, directoryName, recursive) {
    this.debugAlways(`testDeleteDirectoryCommand -- COMMAND deleteDirectory: directoryName="${directoryName}" recursive=${recursive} expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "deleteDirectory", "directoryName": directoryName, "recursive": recursive } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testDeleteDirectoryCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testDeleteDirectoryCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testDeleteDirectoryCommand -- RESPONSE: directoryName="${response.directoryName}" recursive="${response.recursive}" deleted="${response.deleted}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testDeleteDirectoryCommand: !!!!! directoryName="${directoryName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testMakeDirectoryCommand(expecting) {
    this.debugAlways(`testMakeDirectoryCommand -- COMMAND makeDirectory: expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "makeDirectory" } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testMakeDirectoryCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testMakeDirectoryCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testMakeDirectoryCommand -- RESPONSE: directoryName="${response.directoryName}" created="${response.created}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testMakeDirectoryCommand: !!!!!  !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testListFilesCommand(expecting, matchGLOB) {
    this.debugAlways(`testListFilesCommand COMMAND listFiles: matchGLOB="${matchGLOB}" expecting "${expecting}"`);
    try {
      const response = matchGLOB ? await this.sendFSBrokerCommand( { "command": "listFiles", "matchGLOB": matchGLOB } )
                                 : await this.sendFSBrokerCommand( { "command": "listFiles" } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testListFilesCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testListFilesCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testListFilesCommand -- RESPONSE: length=${response.length}`);
          const fileNames = response.fileNames;
          for (const fileName of fileNames) {
            this.debugAlways(`testListFilesCommand -- RESPONSE: fileName="${fileName}"`);
          }
        }
      }
    } catch (error) {
      this.caught(error, `testListFilesCommand !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testListFileInfoCommand(expecting, matchGLOB) {
    this.debugAlways(`testListFileInfoCommand COMMAND listFileInfo: matchGLOB="${matchGLOB}" expecting "${expecting}"`);
    try {
      const response = matchGLOB ? await this.sendFSBrokerCommand( { "command": "listFileInfo", "matchGLOB": matchGLOB } )
                                 : await this.sendFSBrokerCommand( { "command": "listFileInfo" } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testListFileInfoCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testListFileInfoCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testListFileInfoCommand -- RESPONSE: length=${response.length}`);
          const fileInfo = response.fileInfo;
          for (const info of fileInfo) {
            this.debugAlways( `testListFileInfoCommand -- RESPONSE:`
                              + `\n- path="${info.path}"`
                              + `\n- type="${info.type}"`
                              + `\n- size="${info.size}"`
                              + `\n- creationTime="${formatMsToDateTime12HR(info.creationTime)}"`
                              + `\n- lastAccessed="${formatMsToDateTime12HR(info.lastAccessed)}"`
                              + `\n- lastModified="${formatMsToDateTime12HR(info.lastModified)}"`
                              + `\n- permissions="${info.permissions}"`
                            );
          }
        }
      }
    } catch (error) {
      this.caught(error, `testListFileInfoCommand !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testListCommand(expecting, matchGLOB) {
    this.debugAlways(`testListCommand COMMAND list: matchGLOB="${matchGLOB}" expecting "${expecting}"`);
    try {
      const response = matchGLOB ? await this.sendFSBrokerCommand( { "command": "list", "matchGLOB": matchGLOB } )
                                 : await this.sendFSBrokerCommand( { "command": "list" } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testListCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testListCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testListCommand -- RESPONSE: length=${response.length}`);
          const fileNames = response.fileNames;
          for (const fileName of fileNames) {
            this.debugAlways(`testListCommand -- RESPONSE: fileName="${fileName}"`);
          }
        }
      }
    } catch (error) {
      this.caught(error, `testListCommand !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testListInfoCommand(expecting, matchGLOB) {
    this.debugAlways(`testListInfoCommand COMMAND listInfo: matchGLOB="${matchGLOB}" expecting "${expecting}"`);
    try {
      const response = matchGLOB ? await this.sendFSBrokerCommand( { "command": "listInfo", "matchGLOB": matchGLOB } )
                                 : await this.sendFSBrokerCommand( { "command": "listInfo" } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testListInfoCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testListInfoCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testListInfoCommand -- RESPONSE: length=${response.length}`);
          const fileInfo = response.fileInfo;
          for (const info of fileInfo) {
            this.debugAlways( `testListInfoCommand -- RESPONSE:`
                              + `\n- path="${info.path}"`
                              + `\n- type="${info.type}"`
                              + `\n- size="${info.size}"`
                              + `\n- creationTime="${formatMsToDateTime12HR(info.creationTime)}"`
                              + `\n- lastAccessed="${formatMsToDateTime12HR(info.lastAccessed)}"`
                              + `\n- lastModified="${formatMsToDateTime12HR(info.lastModified)}"`
                              + `\n- permissions="${info.permissions}"`
                            );
          }
        }
      }
    } catch (error) {
      this.caught(error, `testListInfoCommand !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testGetFullPathNameCommand(expecting, fileName) {
    this.debugAlways(`testGetFullPathNameCommand -- COMMAND getFullPathName: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "getFullPathName", "fileName": fileName } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testGetFullPathNameCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testGetFullPathNameCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testGetFullPathNameCommand -- RESPONSE: fileName="${response.fileName}" fullPathName="${response.fullPathName}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testGetFullPathNameCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testIsValidFileNameCommand(expecting, fileName) {
    this.debugAlways(`testIsValidFileNameCommand -- COMMAND isValidFileName: fileName="${fileName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "isValidFileName", "fileName": fileName } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testIsValidFileNameCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testIsValidFileNameCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testIsValidFileNameCommand -- RESPONSE: fileName="${response.fileName}" valid="${response.valid}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testIsValidFileNameCommand: !!!!! fileName="${fileName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testIsValidDirectoryNameCommand(expecting, directoryName) {
    this.debugAlways(`testIsValidDirectoryNameCommand -- COMMAND isValidDirectoryName: directoryName="${directoryName}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "isValidDirectoryName", "directoryName": directoryName } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testIsValidDirectoryNameCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testIsValidDirectoryNameCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testIsValidDirectoryNameCommand -- RESPONSE: directoryName="${response.directoryName}" valid="${response.valid}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testIsValidDirectoryNameCommand: !!!!! directoryName="${directoryName}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testGetFileSystemPathNameCommand(expecting) {
    this.debugAlways(`testGetFileSystemPathNameCommand -- COMMAND getFileSystemPathName: expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": "getFileSystemPathName" } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testGetFileSystemPathNameCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testGetFileSystemPathNameCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways(`testGetFileSystemPathNameCommand -- RESPONSE: pathName="${response.pathName}"`);
        }
      }
    } catch (error) {
      this.caught(error, `testGetFileSystemPathNameCommand: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

  async testStatsCommand(expecting, parameters) {
    this.debugAlways("testStatsCommand -- COMMAND stats: parameters:\n", parameters, `\nexpecting "${expecting}"`);
    try {
      var response;
      if (parameters) {
        response = await this.sendFSBrokerCommand( { "command": "stats", "parameters": parameters } );
      } else {
        response = await this.sendFSBrokerCommand( { "command": "stats" } );
      }
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testStatsCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testStatsCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways("testStatsCommand -- RESPONSE: ", response);
        }
      }
    } catch (error) {
      this.caught(error, `!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!,\n`, parameters);
    }
  }

  async testFsbListInfoCommand(expecting, parameters) {
    this.debugAlways("testFsbListInfoCommand -- COMMAND fsbListInfo: parameters:\n", parameters, `\nexpecting "${expecting}"`);
    try {
      var response;
      if (parameters) {
        response = await this.sendFSBrokerCommand( { "command": "fsbListInfo", "parameters": parameters } );
      } else {
        response = await this.sendFSBrokerCommand( { "command": "fsbListInfo" } );
      }
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testFsbListInfoCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testFsbListInfoCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways("testFsbListInfoCommand -- RESPONSE: ", response);
        }
      }
    } catch (error) {
      this.caught(error, `!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!,\n`, parameters);
    }
  }

  async testFsbListCommand(expecting, parameters) {
    this.debugAlways("testFsbListCommand -- COMMAND fsbList: parameters:\n", parameters, `\nexpecting "${expecting}"`);
    try {
      var response;
      if (parameters) {
        response = await this.sendFSBrokerCommand( { "command": "fsbList", "parameters": parameters } );
      } else {
        response = await this.sendFSBrokerCommand( { "command": "fsbList" } );
      }
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testFsbListCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testFsbListCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways("testFsbListCommand -- RESPONSE: ", response);
        }
      }
    } catch (error) {
      this.caught(error, `!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!,\n`, parameters);
    }
  }

  async testUnknownCommand(expecting, command) {
    this.debugAlways(`testUnknownCommand -- COMMAND unkownCommand: command="${command}" expecting "${expecting}"`);
    try {
      const response = await this.sendFSBrokerCommand( { "command": command } );
      if (response) { // missing response and error handled by sendFSBrokerCommand()
        if (response.invalid) {
          this.debugAlways(`testUnknownCommand -- VALIDATION ERROR: "${response.invalid}"`);
        } else if (response.error) {
          this.debugAlways(`testUnknownCommand -- ERROR: "${response.error}"`);
        } else {
          this.debugAlways("testUnknownCommand -- ??? WHY DID WE *NOT* GET AN ERROR ???"); 
        }
      }
    } catch (error) {
      this.caught(error, `testUnknownCommand: !!!!! command="${command}" !!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    }
  }

}
