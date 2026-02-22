# file-system-broker: File System Broker for Mozilla Thunderbird

FileSystemBroker provides other web extensions the ability to safely access the computer's file system.  It provides managed, limited access.

It can read, write, rename, delete, check the existence of, or get the properties of files or it can get a list of files, etc.

FileSystemBroker uses the Thunderbird Extension Experiments API to provide access to the file system.  Using this extension, other Web Extensions can access the file system without having to use the Experiments API directly, which would give them unlimited acccess to the user's computer.

Access to the file system is limited to only a specific directory in the user's Thunderbird Profile Directory.  Each extension that uses FileSystemBroker is limited to only its own specific directory.

On a Windows system, for example, for a user with User ID "user1", the files accessible to an extension with the ID "aaa.bbb@xxx.com" might be in this directory:

         C:\Users\user1\AppData\Roaming\Thunderbird\Profiles\4x4rl22v.default-release\FileSystemBroker\aaa.bbb@xxx.com

Learn more about and get support for this extension by going to: https://github.com/WoofGrrrr/file-system-broker
<br>

__NOTE: Sub-directories are not supported at this time (there is no method to create one.)__

<br>
<br>

## Access Control

Access to FileSystemBroker is granted to all extensions by default, but you
can enable access controls and then grant access to only select extensions. See
below for details.

<br>
<br>

## How to Use FileSystemBroker

To use the FileSystemBroker, an extension can use the FileSystemBroker API to be found in:

         modules/FileSystemBroker/filesystem_broker_api.js

Information about how to use this API can be found below and in the README file in modules/FileSystemBroker

<br>

___ALTERNATIVELY___, an extension can  use FileSystemBroker directly by sending a
command message to this extension by calling the Web Extension function:

         browser.runtime.sendMessage(extensionId, message)

(The FileSystemBroker API does the messaging for you.)

<br>

## These functions are available in the API:

  + access - does the caller have permission to access FileSystemBroker?
  + exists - does a file exist?
  + isRegularFile - does a file exist and is it a Regular file, i.e. NOT a Directory or "other"?
  + isDirectory - does a file exist and is it a Directory, i.e. NOT a Regular file or a a ""other"?
  + hasFiles - does a Directory have files in it?
  + getFileCount- how many files does a Directory have in it?
  + writeFile - write text into a file in file system storage
  + replaceFile - write text into a file in file system storage, replacing any file that already exists
  + appendToFile - write text at the end of a file in file system storage, or create a new file if it does not already exist
  + writeJSONFile - write text into a JSON file in file system storage
  + writeObjectToJSONFile - convert a JavaScript object to JSON and write it into a JSON file in file system storage
  + readFile - return the contents of a file as a strimg
  + readJSONFile - return the contents of a JSON file as text
  + readObjectFromJSONFile - return the contents of a JSON file as a JavaScript object
  + makeDirectory - make the directory for the calling extension
  + getFileInfo - return a FileInfo object containing the attributes for a file
  + renameFile - rename a Regular file
  + deleteFile - delete a Regular file
  + deleteDirectory - delete a Directory
  + listFiles - list the names of Regular files in a directory
  + listFileInfo - list the FileInfo objects for Regular files in a directory
  + list - list all items - Reguar files, Directories, and "other" - in a directory
  + listInfo - list FileInfo objects for all items - Reguar files, Directories, and "other" - in a directory
  + getFullPathName - return the full system pathName for a file
  + isValidFileName - is a fileName valid?
  + isValidDirectoryName - is a directoryName valid?
  + getFileSystemPathName - returns the full pathName of the system directory on which this API operates
  + stats -return an object that contains information about the directory for an extension and its contents
  + fsbListInfo - return a list of FileInfo objects for matching items in the FileSystemBroker directory on which this API operates (INTERNAL USE ONLY!!!)
  + fsbList - return a list of the fileNames and Types of matching items in the FileSystemBroker directory on which this API operates (INTERNAL USE ONLY!!!)
  + fsbStats - return an object that contains information about the FileSystemBroker directory and each sub-directory in it (INTERNAL USE ONLY!!!)


<br>
<br>

The FileSystemBroker API provides a function for each of these operations.  See the API's README file for details.

The FileSystemBroker API can be found in;
> * modules/FileSystemBroker/

To use it in your extension

1. Copy this directory and it's files into the modules directory for your extension:
```
        modules/FileSystemBroker/
```
2. Add a "content_scripts" section, or add to any existing such section, in your manifest.json file:
```
        "content_scripts": [
          {
            "matches": [ "https://*/*" ],
            "js": [
              "FileSystemBroker/filesystem_broker_api.js"
            ]
          }
        ]
```
3. Then add something like the following to your JavaScript code:
```
    import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';
      .
      .
      .
      const fsbApi = new FileSystemBrokerApi();
      var response;
      var alreadyExists;
      var bytesWritten;

      response = fsbApi.exists("file1.txt");
      if (! response) {
      } else if (response.invalid) {
      } else if (response.error) {
      } else
        alreadyExists = response.exists;
        if (alreadyExists) {
        } else {
          response = fsbApi.writeFile("file1.txt", "data", 'create');
          if (! response) {
          } else if (response.invalid) {
          } else if (response.error) {
          } else {
            bytesWritten = response.bytesWritten
          }
        }
      }
```

<br>
<br>

## The Messaging API

In addition to using the FileSystemBroker API, above, an extension can directly send Command Messages to this extension and await the responses.

Here is a simple example to check if a file named "file1.txt" exists:
```
    const FILE_SYSTEM_BROKER_EXTENSION_ID = "file-system-broker@localmotive.com";
      .
      .
      .
    var response;
    var exists = false;
    try {
      const message = { "Command": { "command": "exists", "fileName": "file1.text" } };
      response = await messenger.runtime.sendMessage(FILE_SYSTEM_BROKER_EXTENSION_ID, message);
    } catch (error) {
    }

    if (response) {
      exists = response.exists;
    }
```

<br>

### The Commands:

A command is a message which is an object of the form:

        { Command : { "command": command_name, "<parameter-name>": parameter_value, ... } }

<br>


#### The command can be any one of the following (details below):

        { "command": command_name           [, parameters                                  ] } - response { return_values                                                           }
          ========== ====================== ================================================               =======================================================================
        { "command": "access"                                                                } - response { "access":        string                                                 }
        { "command": "exits"                [, "fileName":      string ]                     } - response { "fileName":      string, "exists":        boolean                       }
        { "command": "isRegularFile",          "fileName":      string                       } - response { "fileName":      string, "isRegularFile": boolean                       }
        { "command": "isDirectory"          [, "directoryName": string ]                     } - response { "directoryName": string, "isDirectory":   boolean                       }
        { "command": "hasFiles"             [, "directoryName": string ]                     } - response { "directoryName": string, "hasFiles":      boolean                       }
        { "command": "getFileCount"         [, "directoryName": string ]                     } - response { "directoryName": string, "fileCount":     integer                       }
        { "command": "writeFile",              "fileName":      string,  "data": UTF8-String } - response { "fileName":      string, "bytesWritten":  integer                       }
        { "command": "replaceFile",            "fileName":      string,  "data": UTF8-String } - response { "fileName":      string, "bytesWritten":  integer                       }
        { "command": "appendToFile",           "fileName":      string,  "data": UTF8-String } - response { "fileName":      string, "bytesWritten":  integer                       }
        { "command": "writeJSONFile",          "fileName":      string,  "data": UTF8-String } - response { "fileName":      string, "bytesWritten":  integer                       }
        { "command": "writeObjectToJSONFile",  "fileName":      string,  "object": object    } - response { "fileName":      string, "bytesWritten":  integer                       }
        { "command": "readFile",               "fileName":      string                       } - response { "fileName":      string, "data":          UTF8-String                   }
        { "command": "readJSONFile",           "fileName":      string                       } - response { "fileName":      string, "data":          UTF8-String                   }
        { "command": "readObjectFromJSONFile", "fileName":      string                       } - response { "fileName":      string, "object":        object                        }
        { "command": "makeDirectory"                                                         } - response { "directoryName": string, "created":       boolean                       }
        { "command": "getFileInfo"          [, "fileName":      string ]                     } - response { "fileName":      string, "fileInfo":      FileInfo or undefined         }
        { "command": "deleteFile",             "fileName":      string                       } - response { "fileName":      string, "deleted":       boolean                       }
        { "command": "deleteDirectory"      [, "directoryName": string ]                     } - response { "directoryName": string, "deleted":       boolean                       }
        { "command": "listFiles"            [, "matchGLOB":     string ]                     } - response { "fileNames":     [],     "length":        integer                       }
        { "command": "listFileInfo"         [, "matchGLOB":     string ]                     } - response { "fileInfo":      [],     "length":        integer                       }
        { "command": "list"                 [, "matchGLOB":     string ]                     } - response { "fileNames":     [],     "length":        integer                       }
        { "command": "listInfo"             [, "matchGLOB":     string ]                     } - response { "fileInfo":      [],     "length":        integer                       }
        { "command": "getFullPathName"      [, "fileName":      string ]                     } - response { "fileName":      string, "fullPathName":  string                        }
        { "command": "isValidFileName",        "fileName":      string                       } - response { "fileName":      string, "valid":         boolean                       }
        { "command": "isValidDirectoryName",   "directoryName": string                       } - response { "directoryName": string, "valid":         boolean                       }
        { "command": "getFileSystemPathName"                                                 } - response { "pathName":      string                                                 }
        { "command": "renameFile", "fromFileName": string, "toFileName: string [, "overwrite": boolean] } - response { "fromFileName": string, "toFileName": string, "renamed": boolean }

<br>

In addition to the responses listed with each command above, a command may return the following responses:

  + Commands may return { "invalid": reason } if the command received invalid parameters, where "reason" is a String that describes the problem.

  + Commands may return { "error": reason } if there was an error processing the command, where "reason" is a String that describes the problem.

  + Commands may return { "error": reason, "code": code } if there was an error processing the command, where "reason" is a String that describes the problem and "code" is an error code.
    + code "400" means that the request to FileSystemBroker is malformed.
    + code "403" means access has been denied.
    + code "404" means that the request to FileSystemBroker is unknown.
    + code "500" means that there was some error that the system does not know how to handle.
    + code "503" means that communcation with FileSystemBroker failed, probably because FileSystemBroker is not installed or is not running.

<br>

### Using The Messaging API - Details:

    As stated earlier, to request that a command be performed, an extension sends a message
    to this extension.  The message is in the form of a JavaScript object with a specific
    structure, i.e. a "Command". Each Command also returns a JavaScript object as a Response.
    To make things easier, the FileSystemBroker API can handle this messaging for you.

    Each command operates on files in a sub-directory of the BrokerFileSystem directory inside
    the user's Thunderbird Profile Folder.  The name of this sub-directory is the Extension ID
    of the extension that has sent the message requesting that a command be performed.

    When an extension sends a message, that extension's Extension ID is made available to the
    message receiver, i.e. this extension.  This way we try to restrict the Sender to accessing
    only files specifically for that Sender. (There might be ways to hack the Extension ID of
    the Sender - I don't know.  Hey, these are just Web Extensions.)

<br>

### The fileNames and directoryNames must be a String with at least one character.

#### ILLEGAL CHARS:

They must not contain the following characters:
   
      < (less-than)
      > (greater-than)
      : (colon)
      " (quote)
      / (forward slash)
      \ (baclward slash)
      | (vertical bar)
      ? (question mark)
      * (asterisk)
      x00-x1F (control characters)
   
#### RESERVED NAMES:

+ They must not be any of the following values:

      con
      prn
      aux
      nul
      com0 - com9
      lpt0 - lpt9

+ IN ADDITION, THE FOLLOWING DIRECTORY NAMES CANNOT BE USED:

      .. (two dots or periods, or, if you're not American, full-stops)
   
#### MAXIMUM LENGTH:

They must not be longer than *64* characters 

In addition, the total pathName of a file or directory must not be
longer than *255* characters.

This is a limitiation of the underlying code in Thunderbird that
performs the actual file system operations.

The length of the pathName *does* depend on where Thunderbird
places the user's profile directory on the given system.  Keep that
in mind.

<br>
<br>
<br>
<br>

## These Are The Commands And Their Responses:


#### access - Determine if the caller has been granted permission to access the FileSystemBroker

    command message: { "Command": { "command": "access" } }

    response:        { "access": string }

                     Returns "granted" if the caller has been granted
                     permission to use FileSystemBroker, "denied" if not.

<br>
<br>
<br>

### exists(extensionId [, fileName])

    Returns true if a file with the given fileName exists
    in the directory for the extensionId.

    The fileName parameter is optional.  If it is not
    provided, returns true if the directory for the
    given extensionId exists.

    command message: { "Command": { "command": "exits" [, "fileName": string] } }

                     The fileName parameter is optional. If not specified, the
                     caller-specific directory (named like the caller's Extension
                     ID) will be tested for existence.

    response:        { "fileName": string, "exists": boolean }

                     If fileName parameter not specified, the extension ID of
                     the calling extension will be returned as the "fileName"
                     response value.

    Returns an "invalid" response if the fileName parameter is invalid.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### isRegularFile - Determine if a file with a given fileName exists in the caller-specific directory (named like the caller's Extension ID) and is a Regular File

    command message: { "Command": { "command": "isRegularFile", "fileName": string } }

    response:        { "fileName": string, "isRegularFile": boolean }

    Returns an "invalid" response if the fileName parameter is missing or invalid.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### isDirectory - Determine if a file with a given fileName exists in the caller-specific directory (named like the caller's Extension ID) and is a Directory

    command message: { "Command": { "command": "isDirectory"[, "directoryName": string] } }

                     The directoryName parameter is optional. If not specified,
                     the caller-specific directory (named like the caller's
                     Extension ID) will be tested for existence and type.

    response:        { "directoryName": string, "isDirectory": boolean }

                     If directoryName parameter not specified, the extension ID of
                     the calling extension will be returned as the "directoryName"
                     response value.

    Returns an "invalid" response if the directoryName parameter is invalid.

    Returns an "error" response if the directory's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

    Sub-directories are not supported at this time (there is no method to create one.)

<br>
<br>
<br>

#### hasFiles - Determine if a directory with a given directoryName exists in the caller-specific directory (named like the caller's Extension ID), is a Directory, and contains files and/or sub-directories

    command message: { "Command": { "command": "hasFiles"[, "directoryName": string] } }

                     The directoryName parameter is optional. If not specified,
                     the caller-specific directory (named like the caller's
                     Extension ID) will be tested for existence, type, and
                     existence of contents.

    response:        { "directoryName": string, "hasFiles": boolean }

                     If directoryName parameter not specified, the extension ID of
                     the calling extension will be returned as the "directoryName"
                     response value.

    Returns an "invalid" response if the directoryName parameter is invalid,
    or if the directory does not exist or is not a directory.

    Returns an "error" response if the directory's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

    Sub-directories are not supported at this time (there is no method to create one.)

<br>
<br>
<br>

#### getFileCount - Determine if a directory with a given directoryName exists in the caller-specific directory (named like the caller's Extension ID) and is a Directory, and returns the number of files and/or sub-directories it contains

    command message: { "Command": { "command": "getFileCount"[, "directoryName": string] } }

                     The directoryName parameter is optional. If not specified,
                     the caller-specific directory (named like the caller's
                     Extension ID) will be tested for existence and type and
                     the count of its contents is returned.

    response:        { "directoryName": string, "fileCount": integer }

                     If directoryName parameter not specified, the extension ID of
                     the calling extension will be returned as the "directoryName"
                     response value.

    Returns an "invalid" response if the directoryName parameter is invalid,
    or if the Directory does not exist or is not a Directory.

    Returns an "error" response if the directory's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

    Sub-directories are not supported at this time (there is no method to create one.)

<br>
<br>
<br>

#### makeDirectory - Create the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "makeDirectory" } }

    response:        { "directoryName": string, "created": boolean }

    Returns an "invalid" response if a file or directory with the name of the caller's Extension ID already exists.

    Returns an "error" response if the directory's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

    Sub-directories are not supported at this time, thus a directoryName parameter is not provided.

<br>
<br>
<br>

#### writeFile - Write the given data to the file with the given fileName in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "writeFile", "fileName": string, "data": UTF8-String[, "writeMode": string] } }
    
    The optional writeMode parameter has these options:
    - 'overwrite'      (the default) will replace any existing file
    - 'replace'        a synonym for 'overwrite'
    - 'append'         will append to the end of an existing file, but will return an error if a file with the given fileName does not already exist
    - 'appendOrCreate' will append to the end of an existing file or create a new file if a file with the given fileName does not already exist
    - 'create'         will create a new file if a file with the given fileName does not exist, but will return an error if the file already exists

    response:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the data parameter is missing or invalid,
    or if the writeMode parameter is not one of the values listed above,
    or if the existence of the file conflicts with the writeMode as specified above.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### replaceFile - Write the given data to the file with the given fileName in the caller-specific directory (named like the caller's Extension ID), like writeFile using "writeMode": "overwrite"

    command message: { "Command": { "command": "writeFile", "fileName": string, "data": UTF8-String } }
    
    response:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid
    or if the data parameter is missing or invalid.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### appendToFile - Write the given data to the file with the given fileName in the caller-specific directory (named like the caller's Extension ID), like writeFile using "writeMode": "appendOrCreate"

    command message: { "Command": { "command": "writeFile", "fileName": string, "data": UTF8-String } }

    response:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid
    or if the data parameter is missing or invalid.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### writeJSONFile - Write the given JSON data - a UTF8-encoded string - to a JSON file with the given fileName in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "writeJSONFile", "fileName": string, "data": UTF8-String[, "writeMode": string] } }
    
    The optional writeMode parameter has these options:
    - 'overwrite'      (the default) will replace any existing file
    - 'replace'        a synonym for 'overwrite'
    - 'create'         will create a new file if a file with the given fileName does not exist, but will return an error if the file already exists

    response:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the data parameter is missing or invalid,
    or if the writeMode parameter is not one of the values listed above,
    or if the existence of the file conflicts with the writeMode as specified above.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### writeObjectToJSONFile - Convert the given object to JSON and write it to a JSON file with the given fileName in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "writeObjectToJSONFile", "fileName": string, "object": object[, "writeMode": string] } }
    
    The optional writeMode parameter has these options:
    - 'overwrite'      (the default) will replace any existing file
    - 'replace'        a synonym for 'overwrite'
    - 'create'         will create a new file if a file with the given fileName does not exist, but will return an error if the file already exists

    response:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the data parameter is missing or invalid,
    or if the writeMode parameter is not one of the values listed above,
    or if the existence of the file conflicts with the writeMode as specified above.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### readFile - Read the file with the given fileName in the caller-specific directory (named like the caller's Extension ID) and return the contents

    command message: { "Command": { "command": "readFile", "fileName": string } }

    response:        { "fileName": string, "data": UTF8-String }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### readJSONFile - Read the JSON file with the given fileName in the caller-specific directory (named like the caller's Extension ID) and return the contents

    command message: { "Command": { "command": "readJSONFile", "fileName": string } }

    response:        { "fileName": string, "data": UTF8-String }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### readObjectFromJSONFile - Read the JSON file with the given fileName in the caller-specific directory (named like the caller's Extension ID) and return the contents as a JavaScript object

    command message: { "Command": { "command": "readObjectFromJSONFile", "fileName": string } }

    response:        { "fileName": string, "object": object }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### getFileInfo - Return the FileInfo object for the item with the given fileName in the caller-specific directory (named like the caller's Extension ID), or <undefined> if the file does not exist

    command message: { "Command": { "command": "getFileInfo" [, "fileName": string] } }

                     The fileName parameter is optional. If not specified, the
                     FileInfo for the caller-specific directory (named like
                     the caller's Extension ID) will be returned.

    response:        { "fileName": string, "fileInfo": FileInfo or undefined  }

                     If fileName parameter not specified, the extension ID of
                     the calling extension will be returned as the "fileName"
                     response value.

                     FileInfo has these entries:
                     - fileName:     the fileName
                     - path:         the full pathname
                     - type:         "regular", "directory", or "other"
                     - size:         for a Regular File, the size in bytes, otherwise -1
                     - creationTime  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
                     - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
                     - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
                     - permissions:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)

    Returns an "invalid" response if the fileName parameter is invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### renameFile - Renames a Regular file in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "renameFile", "fromFileName": string, "toFileName": string[, "overwrite": boolean] } }

                     The overwrite parameter is optional. The default is false.

    response:        { "fromFileName": string, "toFileName": string, "renamed": boolean }

    Returns an "invalid" response if either fileName parameter is invalid,
    or if the file named by fromFileName does not exist or is not a Regular file (is a Directory or "Other",)
    or if the optional overwrite parameter is not boolean,
    or the overwrite parameter is not true and the file named by toFileName already exists.

    Returns an "error" response if either file's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### deleteFile - Delete the Regular file with the given fileName in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "deleteFile", "fileName": string } }

    response:        { "fileName": string, "deleted": boolean }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>
<br>
<br>

#### deleteDirectory - Delete the Directory with the given directoryName in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "deleteDirectory" [, "directoryName": string] [, "recursive": boolean] } }

                     The directoryName parameter is optional. If not specified,
                     the caller-specific directory (named like the caller's
                     Extension ID) will be deleted. (Sub-directories are not
                     supported at this time.)

                     The recursive parameter is optional.  The default is false.
                     If recursive is true, delete the directory and all its
                     contents, including sub-directories.
                     If recursive is false, and the directory contains files
                     and/or sub-directories, returns an error.

    response:        { "directoryName": string, "deleted": boolean }

                     If directoryName parameter not specified, the extension ID of
                     the calling extension will be returned as the "directoryName"
                     response value.

    Returns an "invalid" response if the directoryName parameter is invalid,
    or if the directory does not exist,
    or if it is not actually a Directory,
    or if the directory contains files and/or sub-directories and the recursive parameter is not true.

    Returns an "error" response if the directory's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

    Sub-directories are not supported at this time (there is no method to create one.)

<br>
<br>
<br>

#### listFiles - Return the fileNames of only the Regular Files - not Directories or Other files - in the caller-specific directory (named like the caller's Extension ID), optionally filtering by matching the fileNames to the given GLOB string

    command message: { "Command": { "command": "listFiles" [, "matchGLOB": string] } }

    response:        { "fileNames": [], "length" integer }

    Returns an "invalid" response if the matchGLOB is not a String,
    or if the directory does not exist or is not a Directory,

    Returns an "error" response if the directory's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

    Sub-directories are not supported at this time (there is no method to create one,)
    thus a directoryName parameter is not provided.

<br>
<br>
<br>

#### listFileInfo - Return FileInfo objects for only the Regular Files - not Directories or Other files - in the caller-specific directory (named like the caller's Extension ID), optionally filtering by matching the fileNames to the given GLOB string

    command message: { "Command": { "command": "listFileInfo" [, "matchGLOB": string] } }

    response:        { "fileInfo": [], "length" integer }

                     FileInfo has these entries:
                     - fileName:     the fileName
                     - path:         the full pathname
                     - type:         "regular", "directory", or "other"
                     - size:         for a Regular File, the size in bytes, otherwise -1
                     - creationTime  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
                     - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
                     - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
                     - permissions:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)

    Returns an "invalid" response if the matchGLOB is not a String,
    or if the directory does not exist or is not a Directory,

    Returns an "error" response if the directory's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

    Sub-directories are not supported at this time (there is no method to create one,)
    thus a directoryName parameter is not provided.

<br>
<br>
<br>

#### list - Return the fileNames of the items (all types - Regular, Directory, and Other) in the caller-specific directory (named like the caller's Extension ID), optionally filtering by matching the fileNames to the given GLOB string

    command message: { "Command": { "command": "list" [, "matchGLOB": string] } }

    response:        { "fileNames": [], "length" integer }

    Returns an "invalid" response if the matchGLOB is not a String,
    or if the directory does not exist or is not a Directory,

    Returns an "error" response if the directory's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

    Sub-directories are not supported at this time (there is no method to create one,)
    thus a directoryName parameter is not provided.

<br>
<br>
<br>

#### listInfo - Return FileInfo objects for the items (all types - Regular, Directory, and Other) in the caller-specific directory (named like the caller's Extension ID), optionally filtering by matching the fileNames to the given GLOB string

    command message: { "Command": { "command": "list" [, "matchGLOB": string] } }

    response:        { "fileInfo": [], "length" integer }

                     FileInfo has these entries:
                     - fileName:     the fileName
                     - path:         the full pathname
                     - type:         "regular", "directory", or "other"
                     - size:         for a Regular File, the size in bytes, otherwise -1
                     - creationTime  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
                     - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
                     - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
                     - permissions:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)

    Returns an "invalid" response if the matchGLOB is not a String,
    or if the directory does not exist or is not a Directory,

    Returns an "error" response if the directory's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

    Sub-directories are not supported at this time (there is no method to create one,)
    thus a directoryName parameter is not provided.

<br>
<br>
<br>

#### getFullPathName - Return the full path name for the given fileName in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "getFullPathName" [, "fileName": string] } }

                     The fileName parameter is optional. If not specified, the
                     full path name for the caller-specific directory (named
                     like the caller's Extension ID) will be returned.

    response:        { "fileName": string, "fullPathName": string }

                     If fileName parameter not specified, the extension ID of
                     the calling extension will be returned as the "fileName"
                     response value.

    Returns an "invalid" response if the fileName parameter is invalid.

    The file with the given fileName need not actually exist.  This command merely returns
    what the full pathname would be.

<br>
<br>
<br>

#### isValidFileName - Determine if the given fileName is valid

    command message: { "Command": { "command": "isValidFileName", "fileName": string } }

    response:        { "fileName": string, "valid": boolean }

    Returns an "invalid" response if the fileName parameter is not provided or is not a String.

    The file with the given fileName need not actually exist.  This command merely checks
    if the given string is a valid fileName.

<br>
<br>
<br>

#### isValidDirectoryName - Determine if the given directoryName is valid

    command message: { "Command": { "command": "isValidDirectoryName", "directoryName": string } }

    response:        { "directoryName": string, "valid": boolean }

    Returns an "invalid" response if the directoryName parameter is not provided or is not a String.

    The directory with the given directoryName need not actually exist.  This command merely checks
    if the given string is a valid directoryName.

<br>
<br>
<br>

####  getFileSystemPathName - Returns the full pathName of the directory that this API uses for the calling extension.

    command message: { "Command": { "command": "getFileSystemPathName" } }

    response:        { "pathName": string }

<br>
<br>
<br>

### stats( [ { ['includeChildInfo': boolean] ['types': array of string] } ] )

    Returns a JavaScript object that contains information
    about the directory and the items in the directory
    for the given extensionId.
<br>
<br>
    The 'parameters' parameter is optional. If it is not
    provided, information for each child is NOT included
    in the result.
<br>
<br>
    The parameters.includeChildInfo parameter is optional.
    If it is not provided, it defaults to false. If true, the
    object returned includes information for each child
    item.
<br>
<br>
    The parameters.types parameter is optional and is allowed
    only when parameters.includeChildInfo is true.  This is
    an array of String containing one or more item types:
<br>
      'regular', 'directory', 'other', 'unknown', 'error'
<br>
    If given, only the information for items whose type is
    listed in this array will be returned.
<br>
    The default is ALL types.
<br>
<br>
    The returned object:
```
      {
        'parameters':                               object:           the parameters object supplied to the incoming command
        'stats':
          { directoryName:                          string:           should match the extensionId                  
              {
                'includeChildInfo':                 boolean:          incoming parameter
                'types':                            array of string:  incoming parameter (OPTIONAL: only if includeChildInfo is true)
                'dirName':                          string:           directory fileName
                'dirPath':                          string:           directory full pathName
                'error':                            string:           a description if there was an error getting information. None of the data below will be present.
                'count_children':                   integer:          total number of child items
                'count_regular':                    integer:          number of child items with type 'regular'
                'count_directory':                  integer:          number of child items with type 'directory'
                'count_other':                      integer:          number of child items with type 'other'
                'count_unknown':                    integer:          number of child items whose type is none of the three above
                'count_error':                      integer:          number of child items whose type could not be determined
                'time_childCreation_earliest':      integer:          earliest Creation Time      in MS of all child items (OS-dependent) (undefined if no children)
                'time_childCreation_latest':        integer:          latest   Creation Time      in MS of all child items (OS-dependent) (undefined if no children)
                'time_childLastAccessed_earliest':  integer:          earliest Last Accessed Time in MS of all child items (OS-dependent) (undefined if no children)
                'time_childLastAccessed_latest':    integer:          latest   Last Accessed Time in MS of all child items (OS-dependent) (undefined if no children)
                'time_childLastModified_earliest':  integer:          earliest Last Modified Time in MS of all child items (OS-dependent) (undefined if no children)
                'time_childLastModified_latest':    integer:          latest   Last Modified Time in MS of all child items (OS-dependent) (undefined if no children)
                'size_smallest':                    integer:          smallest size (bytes)  of all child items with type 'regular' (undefined if no items with this type)
                'size_largest':                     integer:          largest  size (bytes)  of all child items with type 'regular' (undefined if no items with this type)
                'size_total':                       integer:          total of sizes (bytes) of all child items with type 'regular  (undefined if no items with this type)
                [ 'childInfo': ]                    array of object:          (OPTIONAL: only if includeChildInfo is true)
                                                      {
                                                        'name'                string:   item fileName
                                                        'path'                string:   item full pathName
                                                        'type'                string:   item type - 'regular', 'directory', 'other', 'unknown', 'error'
                                                        'creationTime':       integer:  Creation Time      in MS (OS-dependent)
                                                        'lastAccessedTime':   integer:  Last Accessed Time in MS (OS-dependent)
                                                        'lastModifiedTime':   integer:  Last Modified Time in MS (OS-dependent)
                                                        [ 'size': ]           integer:  file size (bytes)        (OPTIONAL: only for items with type 'regular')
                                                      }
              }
          }
      }
```
<br>
<br>
    Returns "invalid" if parameters is provided and is not an object,
<br>
    or if paramaters.includeChildInfo is provided and is not boolean,
<br>
    or if paramaters.types is provided and is not an Array that contains the expected values.
<br>
<br>
    Reurns "error" if the file's full pathName is > 255 characters,
<br>
    or if there is an operating system error.

<br>
<br>
<br>

### fsbListInfo( [ { ['matchGLOB': matchGLOB] ['types': types] } ] ) (INTERNAL USE ONLY)

    Returns an onbect containing an array of FileInfo objects
    listing the File Info for the items in the top-directory
    on which this extension operates.
<br>
<br>
    If the optional parameters.matchGLOB parameter is given, only
    the information for items whose names match the given GLOB will
    be returned.
<br>
<br>
    If the optional parameters.types array parameter is given,
    only the information for items whose type is listed in the
    parameters.types array will be returned. paramaters.types
    is an array of one or more of:
<br>
      'regular', 'directory, 'other'
<br>
    The default is ALL types.
<br>
<br>
    The returned object:
```
      {
        'parameters':  object:             the parameters object supplied to the incoming command
        'fileInfo:     array of FileInfo:
                         {
                           'fileName:      string:   the fileName
                           'path:          string:   the full pathname
                           'type:          string:   "regular", "directory", or "other"
                           'size:          integer:  for a Regular File, the size in bytes, otherwise -1
                           'creationTime   integer:  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
                           'lastAccessed:  integer:  milliseconds since 1970-01-01T00:00:00.000Z
                           'lastModified:  integer:  milliseconds since 1970-01-01T00:00:00.000Z
                           'permissions:   integer:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)
                         }  
```
<br>
<br>
    If the Directory does not exist, it will be created and an
    empty array is returned.
<br>
<br>
    Returns "invalid" if parameters is provided and is not an object,
<br>
    or if paramaters.matchGLOB is provided and is not a String,
<br>
    or if paramaters.types is provided and is not an Array that contains the expected values
<br>
<br>
    Returns "error" if the directory's full pathName is > 255 characters,
<br>
    or if there is an operating system error.

<br>
<br>
<br>

### fsbList( [ { ['matchGLOB': matchGLOB] ['types': types] } ] ) (INTERNAL USE ONLY)

    Returns an object containing an array listing information
    for the items in the top-directory on which this extension
    operates.
<br>
<br>
    If the optional parameters.matchGLOB parameter is given, only
    the information for items whose names match the given GLOB will
    be returned.
<br>
<br>
    If the optional parameters.types array parameter is given,
    only the information for items whose type is listed in the
    parameters.types array will be returned. paramaters.types
    is an array of one or more of:
<br>
      'regular', 'directory, 'other'
<br>
    The default is ALL types.
<br>
<br>
    The items in the returned array are object
    The returned object:
```
      {
        'parameters':  object:           the parameters object supplied to the incoming command
        'list':        array of object:
                         {
                           'name':       string:  the name of the item
                           'type:        string:  "regular", "directory", or "other"
                         }  
```
<br>
<br>
    If the Directory does not exist, it will be created and an
    empty array is returned.
<br>
<br>
    Returns "invalid" if parameters is provided and is not an object,
<br>
    or if paramaters.matchGLOB is provided and is not a String,
<br>
    or if paramaters.types is provided and is not an Array that contains the expected values
<br>
<br>
    Returns "error" if the directory's full pathName is > 255 characters,
<br>
    or if there is an operating system error.

<br>
<br>

### fsbStats()  (INTERNAL USE ONLY)

    Returns an Object that provides information about each directory
    inside the top-level directory in which this extension operates.
<br>
<br>
    The returned object contains an object with statistics for the FileSystemBroker as a whole
    and an array of object, indexed by Directory Name, with statistics for each sub-directory
    in the top-level FileSystemBroker directory:
```
      'stats': {
        'fsbStats': {
                     'dirName':                           string:   directory fileName
                     'dirPath':                           string:   directory full pathName
                     'count_total':                       integer:  total number of descendent items
                     'count_type_regular':                integer:  number of descendent items with type 'regular'
                     'count_type_directory':              integer:  number of descendent items with type 'directory'
                     'count_type_other':                  integer:  number of descendent items with type 'other'
                     'count_type_unknown':                integer:  number of descendent items whose type is none of the three above
                     'count_type_error':                  integer:  number of descendent items whose type could not be determined
                     'time_childCreation_earliest':       integer:  earliest Creation Time      in MS of all descendent items (OS-dependent) (undefined if no children)
                     'time_childCreation_latest':         integer:  latest   Creation Time      in MS of all descendent items (OS-dependent) (undefined if no children)
                     'time_childLastAccessed_earliest':   integer:  earliest Last Accessed Time in MS of all descendent items (OS-dependent) (undefined if no children)
                     'time_childLastAccessed_latest':     integer:  latest   Last Accessed Time in MS of all descendent items (OS-dependent) (undefined if no children)
                     'time_childLastModified_earliest':   integer:  earliest Last Modified Time in MS of all descendent items (OS-dependent) (undefined if no children)
                     'time_childLastModified_latest':     integer:  latest   Last Modified Time in MS of all descendent items (OS-dependent) (undefined if no children)
                     'size_smallest':                     integer:  smallest size  (bytes) of all descendent items with type 'regular' (undefined if no items with type 'regular')
                     'size_largest':                      integer:  largest  size  (bytes) of all descendent items with type 'regular' (undefined if no items with type 'regular')
                     'size_total':                        integer:  total of sizes (bytes) of all descendent items with type 'regular' (undefined if no items with type 'regular')
        },
        'dirSstats': array of object, indexed by Directory Name
                       {
                         'dirName':                           string:   directory fileName
                         'dirPath':                           string:   directory full pathName
                         'error':                             string:   a description if there was an error getting information. None of the data below will be present.
                         'count_children':                    integer:  total number of child items
                         'count_type_regular':                integer:  number of child items with type 'regular'
                         'count_type_directory':              integer:  number of child items with type 'directory'
                         'count_type_other':                  integer:  number of child items with type 'other'
                         'count_type_unknown':                integer:  number of child items whose type is none of the three above
                         'count_type_error':                  integer:  number of child items whose type could not be determined
                         'time_childCreation_earliest':       integer:  earliest Creation Time      in MS of all child items (OS-dependent) (undefined if no children)
                         'time_childCreation_latest':         integer:  latest   Creation Time      in MS of all child items (OS-dependent) (undefined if no children)
                         'time_childLastAccessed_earliest':   integer:  earliest Last Accessed Time in MS of all child items (OS-dependent) (undefined if no children)
                         'time_childLastAccessed_latest':     integer:  latest   Last Accessed Time in MS of all child items (OS-dependent) (undefined if no children)
                         'time_childLastModified_earliest':   integer:  earliest Last Modified Time in MS of all child items (OS-dependent) (undefined if no children)
                         'time_childLastModified_latest':     integer:  latest   Last Modified Time in MS of all child items (OS-dependent) (undefined if no children)
                         'size_smallest':                     integer:  smallest size  (bytes) of all child items with type 'regular' (undefined if no items with type 'regular')
                         'size_largest':                      integer:  largest  size  (bytes) of all child items with type 'regular' (undefined if no items with type 'regular')
                         'size_total':                        integer:  total of sizes (bytes) of all child items with type 'regular' (undefined if no items with type 'regular')
                       }
        }
      }

```
<br>
<br>
    Returns 'error' if any directory's full pathName is > 255 characters,
<br>
    or if there is an operating system error.

<br>
<br>
<br>
<br>

## Access Control - Details

Access to FileSystemBroker is granted to ALL extensions by default, but you
can enable Access Controls and then Grant or Deny access to only select extensions.

> If Access Controls are Enabled, any extension that has not been explicitly
> Granted or Denied access, i.e. they are __NOT__ in the Extension List,
> will be implicitly Denied access.


#### To enable Access Control, go to the FileSystemBroker Settings Tab:
1. Open the Thunderbird Add-ons Manager
    1. In the menus, select: Tools -> Add-ons and Themes
    2. On the left side of the tab, click on Extensions
2. Find FileSystemBroker
3. Click the Options button
4. The FileSystemBroker Settings Tab is displayed
5. Check the "Grant only select Extensions access to FileSystemBroker" Checkbox
6. The "Extension Access Controls" Section and the Extension List will be displayed
7. Add any extensions to which you want to Grant access to the Extension List
7. Grant access to the Extensions as desired

#### To Add An Extension to The Extension List

There are three ways add an extension to the Extension List:

* Manually:
    1. Click the "Add New" Button on the Actions Panel or click the "Add" Icon at the top-right of the Extension List header
        * If you do not see the Buttons on the Actions Panel, click the small triangle icon to the left of "Actions".
    2. Just below the Extension List header, the Extension Editor line will be displayed
    3. Enter the Extension Name and Id
    4. Check the "Grant Access" Checkbox to grant acccess to the extension or Un-Check it to deny access
    5. Click the "Save" Icon
* From the Installed Extensions List:
    1. Click the "Installed Extensions" button on the Actions Panel
        * If you do not see the Buttons on the Actions Panel, click the small triangle icon to the left of "Actions".
    2. The "Add Installed Extensions" Window is opened
    3. Select one or more extensions
    4. Click the "Add" Button
        * The extensions will be added to the Extension List, but they will ___not___ have been granted access
* When an extension tries to access FileSystemBroker:
    1. Open the FileSystemBroker Settings Tab
        1. Open the Thunderbird Add-ons Manager
            1. In the menus, select: Tools -> Add-ons and Themes
            2. On the left side of the tab, click on Extensions
        2. Find FileSystemBroker
        3. Click the Options button
    2. Check the "When an Extension requests access and is not granted or denied, display a dialog where you can grant or deny it" Checkbox
    3. When an extension attempts to access FileSystemBroker and has not already been explicitly granted or denied access, the "FileSystemBroker Access Control" Pop-Up Window will be displayed
    4. Click on the "Grant" or "Deny" Button
       * If you click the "Grant" Button, the extension will be added to the Extension List and access will be granted
       * If you click the "Deny" Button, the extension will be added to the Extension List and access will be denied. The pop-up window will **not** be displayed again unless the extension
         is removed from the Extension List
       * If you click the "Cancel" Button or simply close the window, the extension will **NOT** be added to the Extension List and the pop-up window **will** be displayed again the next time the extension tries again

#### To Grant Access to An Extension

There are five ways to GRANT access to an extension:

* When adding a new extension, check the "Grant Access" Checkbox
* Check the "Grant Access" Checkbox to the left of the extension in the Extension List
* Click the "Grant All" Button in the Actions Sub-Panel of the Extension Action Controls Panel
    * If you do not see the Buttons on the Actions Panel, click the small triangle icon to the left of "Actions".
* Select one or more extensions in the Extension List, then click the "Grant Selected" Button in the Actions Sub-Panel of the Extension Action Controls Panel
* Edit the extension:
    1. Click the "Edit" Icon to the eight of the extension in the Extension List
    2. Just below the Extension List header, the Extension Editor line will be displayed
    3. Check the "Grant Access" Checkbox to the left of the Extension Name
    4. Click the "Save" Icon to the right of the Extension ID

#### To Deny Access to An Extension

There are six ways to DENY access to an extension:

* When adding a new extension, un-check the "Grant Access" Checkbox
* Un-Check the "Grant Access" Checkbox to the left of the extension in the Extension List
    * The "FileSystemBroker Access Control" Pop-Up Window will **not** be displayed then next time the extension tries access FileSystemBroker
* Click the "Deny All" Button in the Actions Sub-Panel of the Extension Action Controls Panel
    * If you do not see the Buttons on the Actions Panel, click the small triangle icon to the left of "Actions".
* Select one or more extensions in the Extension List, then click the "Deny Selected" Button in the Actions Sub-Panel of the Extension Action Controls Panel
* Delete the extension from the Extension List
    * Click the "Delete" Icon to the right of the extension
    * -or- Select one or more extensions in the Extension List, then click the "Delete Selected" Button in the Actions Sub-Panel of the Extension Action Controls Panel
    * If it's enabled, the "FileSystemBroker Access Control" Pop-Up Window **will** be displayed the next time the extension tries access FileSystemBroker
* Edit the extension:
    1. Click the "Edit" Icon to the right of the extension in the Extension List
    2. Just below the Extension List header, the Extension Editor line will be displayed
    3. Un-Check the "Grant Access" Checkbox to the left of the Extension Name
    4. Click the "Save" Icon to the right of the Extension ID

> NOTE: If Access Control is Enabled, any extensions that are **NOT** in the Extension List will be implicitly denied access.
> If the "FileSystemBroker Access Control" Pop-Up Window is enabled, when any extension that is **NOT** in the Extension List
> tries to use FileSystemBroker, the pop-up window **will** be displayed the next time the extension tries access FileSystemBroker

#### Automatic Extension Removal

FileSystemBroker will automatically remove extensions that have been uninstalled from Thunderbird.

The default is to remove them when they were uninstalled more than 2 days in the past.

You can change this setting by selecting a value for the "__Automatically Remove Extensions that
have been Uninstalled__" Select Box on the FileSystemBroker Settings Tab. You can choose
a different number of days, you can choose to have the Extenstion removed as soon as it has
been uninstalled, or you can disable this feature altogether.

<br>
<br>
<br>

## Backing up And Restoring FileSystemBroker Settings

You can Back Up you FileSystemBroker settings to a file (using FileSystemBroker) and
restore your settings from a backup file at another time. To do this, you use the
Backup Manager.

To open the Backup Manager", click the "Manage Backups" Button on the FileSystemManager Settings Tab.

A list of existing fsbbackup files is displayed.  You can create a new backup file, restore from an
existing backup file, or delete one or more backup files.

<br>
<br>
<br>

## FileSystemBroker Event Logging

FileSystemBroker logs certain events and writes them to Files. You can
choose which events get logged, and you can use the Event Log Manager to
List, View, Archive, or Delete logs.

#### Automatic Event Log Deletion

FileSystemBroker will automatically delete logs older than a selected
number of days.  The default is 2 weeks (14 days.)  You can disable this
or you can change the number of days using the "__Automatically delete
Event Logs older than__" Select Box.

* If you do not see the Select Box, click on the small triangle icon
to the left of "Event Logging Options".

* Archived Event Logs will ___not___ get deleted during automatic Event Log deletion.

#### To Choose Which Events Types Get Logged

The FileSystemBroker Settings Tab has a section labeled "Event Logging
Options".

There are Checkboxes for several events types.

* If you do not see the Checkboxes, click on the small triangle icon to 
the left of "Event Logging Options".

Check a Checkbox to start logging an event type.  Un-check it to stop
logging the event type.

These are the Event Types that can be logged:
* Access Events - Access was Granted
* Access Denied Events - Access was Denied
* Internal Command Requests - Internal command requests from FileSystemBroker itself
* Internal Command Results - Results of internal command requests from FileSystemBroker itself
* External Command Requests - Command requests from other Extensions
* External Command Results - Results of command requests from other Extensions
* Internal Events - Internal FileSystemBroker events, like extension startup, automatic daily Event Log deletion, automatic removal of uninstalled extensions, etc

####  Event Log Manager

The Event Log Manager lists existing Event Logs and allows you to view, archive
or delete them. Archived Event Logs will ___not___ get deleted during automatic 
Event Log deletion.

Click the "Manage Event Logs" Button on the FileSystemBroker Settings Tab to
open the Event Log Manager.



<br>
<br>
<br>

## How to install (FUTURE):

Head over to [addons.thunderbird.net][ic-mx MABXXX] to find the current
version.  Development releases might be available earlier in the
[Releases] section on GitHub.

  [ic-mx]: MABXXX https://addons.thunderbird.net/addon/file-system-broker/
  [releases]: https://github.com/WoofGrrrr/file-system-broke/releases
* ___FileSystemBroker DOES use the Web Extension Experiments API for access to the computer's file system, so you must allow full, unrestricted access to Thunderbird and your computer, otherwise it cannot function.___

<br>



## How to install this Extension from GitHub:

1. Download the .zip file from GitHub:
    1. Go to this page in your browser: https://github.com/WoofGrrrr/file-system-broker/
    2. Look for file-system-broker.zip file in the list
    3. Use your browser to download it - usually you can just click on it
    4. Place the file somewhere you will remember it
2. Open Thunderbird's **Add-ons and Themes** Tab
    + Tools -> Add-ons and Themes
3. Select the **Extensions** Tab on the left
4. Click on the **Gear** icon
5. Select **Install Add-on From File...**
6. Find the file you downloaded from GitHub and double-click on it
* ___FileSystemBroker DOES use the Web Extension Experiments API for access to the computer's file system, so you must allow full, unrestricted access to Thunderbird and your computer, otherwise it cannot function.___

<br>



## How to install the latest versions of this Extension from GitHub:

1. Download the .zip file from GitHub:
    1. Go to this page in your browser: https://github.com/WoofGrrrr/file-system-broker/releases
    2. On the left side of the page, click on the release you want 
    3. Look for the file-system-broker.zip file in the list
    4. Use your browser to download it - usually you can just click on it
    5. Place the file somewhere you will remember it
2. Open Thunderbird's **Add-ons and Themes** Tab
    + Tools -> Add-ons and Themes
3. Select the **Extensions** Tab on the left
4. Click on the **Gear** icon
5. Select **Install Add-on From File...**
6. Find the file you downloaded from GitHub and double-click on it
* ___FileSystemBroker DOES use the Web Extension Experiments API for access to the computer's file system, so you must allow full, unrestricted access to Thunderbird and your computer, otherwise it cannot function.___

<br>

## Notes

MABXXX

<br>

## Attribution

This addon uses code from other projects:

  * Internally, this extension uses an enhancement of this extension: \[webext-support FileSystem API\]: https://github.com/thunderbird/webext-support/tree/master/experiments/FileSystem
