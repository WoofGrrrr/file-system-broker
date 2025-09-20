# file-system-broker: File System Broker for Mozilla Thunderbird

The File System Broker Extension uses the Web Extension Experiments API to provide
limited access to the computer's file system.

Its purpose is to make it so that other Web Extensions can access the computer's
file system without having to use the Experiments API directly. Access to the
file system is limited to only a specific directory in the user's Profile Folder.
It can get a list of files, write, read, check the existence of, get properties
of, rename, and delete files, etc, in *only* that directory.

To use the File System Broker, an extension can use the API to be found in;
  * modules/FileSystemBroker/filesystem_broker_api.js

(information about how to use this API can be found below.)

ALTERNATIVELY, an extension can  use File SYstem Broker by sending a
command message to this extension by calling the Web Extension function:
  * browser.runtime.sendMessage(extensionId, message)

(The FileSystemBroker API does for you.)

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

The FileSystemBroker API provides a function for each of these operations.  See the API's READMEd file for details.

<br>

## In addition to using the FileSystemBroker API, an extension can directly send Command Messages to this extension and wait for the responses.

<br>

### The Commands:

An extension can use this extension by using the FileSystemBroker API. The
module has a method for each of the functions listed above.
Read the README file in modules/FileSystemBroker for more information.

The message is a command, which is an object of the form:

        { Command : { "command": command_name, "<parameter-name>": parameter_value, ... } }

<br>


#### The command can be any one of the following (details below):

        { "command": command_name           [, parameters                                  ] } - returns { return_values                                                           }
          ========== ====================== ================================================               =======================================================================
        { "command": "access"                                                                } - returns { "access":        string                                                 }
        { "command": "exits"                [, "fileName":      string ]                     } - returns { "fileName":      string, "exists":        boolean                       }
        { "command": "isRegularFile",          "fileName":      string                       } - returns { "fileName":      string, "isRegularFile": boolean                       }
        { "command": "isDirectory"          [, "directoryName": string ]                     } - returns { "directoryName": string, "isDirectory":   boolean                       }
        { "command": "hasFiles"             [, "directoryName": string ]                     } - returns { "directoryName": string, "hasFiles":      boolean                       }
        { "command": "getFileCount"         [, "directoryName": string ]                     } - returns { "directoryName": string, "fileCount":     integer                       }
        { "command": "writeFile",              "fileName":      string,  "data": UTF8-String } - returns { "fileName":      string, "bytesWritten":  integer                       }
        { "command": "replaceFile",            "fileName":      string,  "data": UTF8-String } - returns { "fileName":      string, "bytesWritten":  integer                       }
        { "command": "appendToFile",           "fileName":      string,  "data": UTF8-String } - returns { "fileName":      string, "bytesWritten":  integer                       }
        { "command": "writeJSONFile",          "fileName":      string,  "data": UTF8-String } - returns { "fileName":      string, "bytesWritten":  integer                       }
        { "command": "writeObjectToJSONFile",  "fileName":      string,  "object": object    } - returns { "fileName":      string, "bytesWritten":  integer                       }
        { "command": "readFile",               "fileName":      string                       } - returns { "fileName":      string, "data":          UTF8-String                   }
        { "command": "readJSONFile",           "fileName":      string                       } - returns { "fileName":      string, "data":          UTF8-String                   }
        { "command": "readObjectFromJSONFile", "fileName":      string                       } - returns { "fileName":      string, "object":        object                        }
        { "command": "makeDirectory"                                                         } - returns { "directoryName": string, "created":       boolean                       }
        { "command": "getFileInfo"          [, "fileName":      string ]                     } - returns { "fileName":      string, "fileInfo":      FileInfo or undefined         }
        { "command": "deleteFile",             "fileName":      string                       } - returns { "fileName":      string, "deleted":       boolean                       }
        { "command": "deleteDirectory"      [, "directoryName": string ]                     } - returns { "directoryName": string, "deleted":       boolean                       }
        { "command": "listFiles"            [, "matchGLOB":     string ]                     } - returns { "fileNames":     [],     "length":        integer                       }
        { "command": "listFileInfo"         [, "matchGLOB":     string ]                     } - returns { "fileInfo":      [],     "length":        integer                       }
        { "command": "list"                 [, "matchGLOB":     string ]                     } - returns { "fileNames":     [],     "length":        integer                       }
        { "command": "listInfo"             [, "matchGLOB":     string ]                     } - returns { "fileInfo":      [],     "length":        integer                       }
        { "command": "getFullPathName"      [, "fileName":      string ]                     } - returns { "fileName":      string, "fullPathName":  string                        }
        { "command": "isValidFileName",        "fileName":      string                       } - returns { "fileName":      string, "valid":         boolean                       }
        { "command": "renameFile", "fromFileName": string, "toFileName: string [, "overwrite": boolean] } - returns { "fromFileName": string, "toFileName": string, "renamed": boolean }

<br>

  + Commands may return { "invalid": reason } if the command received invalid parameters, where "reason" is a String that describes the problem.

  + Commands may return { "error": reason } if there was an error processing the command, where "reason" is a String that describes the problem.

  + Commands may return { "error": reason, "code": code } if there was an error processing the command, where "reason" is a String that describes the problem and "code" is an error code.
    + "400" means that the request to FileSystemBroker is malformed.
    + "403" means access has been forbidden.
    + "404" means that the request to FileSystemBroker is unknown.
    + "500" means that there was some error that the system does not know how to handle.
    + "503" means that communcation with FileSystemBroker failed, probably because FileSystemBroker is not installed or is not running.

<br>

### Details:

    As stated earlier, to request that a command be performed, an extension sends a message to this extension.  The message is in the
    form of a JavaScript object with a specific structure, i.e. a "command". Each command also returns a JavaScript object.  To make
    things easier, the API can handle this messaging for you.

    Each command operates on files in a sub-drectory of the BrokerFileSystem directory inside the user's Thunderbird Profile Folder.
    The name of this sub-directory is the Extension ID of the extension that has sent the message requesting that a command be performed.
    When an extension sends a message, that extension's Extension ID is made available to the the message receiver, i.e. this extension.
    This way we try to restrict the Sender to accessing only files specifically for that Sender. (There might be ways to hack the
    Extension ID of the Sender - I don't know.  Hey, these are just Web Extensions.)

    Sub-Directories are not supported as this time.

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

They must not be any of the following values:

      con
      prn
      aux
      nul
      com0 - com9
      lpt0 - lpt9
   
#### MAXIMUM LENGTH:

They must not be longer than *64* characters 

In addition, the total pathName of a file or directory must not be
longer than *255* characters.

This is a limitiation of the underlying code in Thunderbird that
performs the actual file system operations.

The length of the pathName *does* depend on where the Thunderbird
places the user's profile directory on the given system.

<br>

## These Are The Commands And Their Responses:


#### access - Determine if the caller has been granted permission to access the FileSystemBroker

    command message: { "Command": { "command": "access" } }

    response:        { "access": string }

                     Returns "granted" if the caller has been granted
                     permission to use FileSystemBroker, "denied" if not.

<br>


#### exists - Determine if an item (Regular File, Directory, or "other") with a given fileName exists in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "exits" [, "fileName": string] } }

                     The fileName parameter is optional. If not specified, the
                     caller-specific directory (named like the caller's Extension
                     ID) will be tested for existence.

    response:        { "Command": { "fileName": string, "exists": boolean }

                     If fileName parameter not specified, the extension ID of
                     the calling extension will be returned as the "fileName"
                     response value.

    Returns an "invalid" response if the fileName parameter is invalid.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>


#### isRegularFile - Determine if a file with a given fileName exists in the caller-specific directory (named like the caller's Extension ID) and is a Regular File

    command message: { "Command": { "command": "isRegularFile", "fileName": string } }

    response:        { "fileName": string, "isRegularFile": boolean }

    Returns an "invalid" response if the fileName parameter is missing or invalid.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

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

<br>


#### makeDirectory - Create the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "makeDirectory" } }

    response:        { "directoryName": string, "created": boolean }

    Returns an "invalid" response if a file or directory with the name of the caller's Extension ID already exists.

    Returns an "error" response if the directory's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

    Sub-Directories are not supported as this time, thus a directoryName parameter is not supported.

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


#### replaceFile - Write the given data to the file with the given fileName in the caller-specific directory (named like the caller's Extension ID), like writeFile using "writeMode": "overwrite"

    command message: { "Command": { "command": "writeFile", "fileName": string, "data": UTF8-String } }
    
    response:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid
    or if the data parameter is missing or invalid.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>


#### appendToFile - Write the given data to the file with the given fileName in the caller-specific directory (named like the caller's Extension ID), like writeFile using "writeMode": "appendOrCreate"

    command message: { "Command": { "command": "writeFile", "fileName": string, "data": UTF8-String } }

    response:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid
    or if the data parameter is missing or invalid.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

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


#### readFile - Read the file with the given fileName in the caller-specific directory (named like the caller's Extension ID) and return the contents

    command message: { "Command": { "command": "readFile", "fileName": string } }

    response:        { "fileName": string, "data": UTF8-String }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>


#### readJSONFile - Read the JSON file with the given fileName in the caller-specific directory (named like the caller's Extension ID) and return the contents

    command message: { "Command": { "command": "readJSONFile", "fileName": string } }

    response:        { "fileName": string, "data": UTF8-String }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>


#### readObjectFromJSONFile - Read the JSON file with the given fileName in the caller-specific directory (named like the caller's Extension ID) and return the contents as a JavaScript object

    command message: { "Command": { "command": "readObjectFromJSONFile", "fileName": string } }

    response:        { "fileName": string, "object": object }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>


#### getFileInfo - Return the FileInfo object for the item with the given fileName in the caller-specific directory (named like the caller's Extension ID), or <undefined> if the file does not exist

    command message: { "Command": { "command": "getFileInfo" [, "fileName": string] } }

                     The fileName parameter is optional. If not specified, the
                     FileInfo for the caller-specific directory (named like
                     the caller's Extension ID) will be returned.

    response:        { "Command": { "fileName": string, "fileInfo": FileInfo or undefined  }

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


#### renameFile - Renames a Regular file in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "renameFile", "fromFileName": string, "toFileName": string[, "overwrite": boolean] } }

                     The oviwrite parameter is optional. The default is false.

    response:        { "fromFileName": string, "toFileName": string, "renamed": boolean }

    Returns an "invalid" response if either fileName parameter is invalid,
    or if the file named by fromFileName does not exist or is not a Regular file (is a Directory or "Other",)
    or if the optional overwrite parameter is not boolean,
    or the overwrite parameter is not true and the file named by toFileName already exists.

    Returns an "error" response if either file's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

<br>


#### deleteFile - Delete the Regular file with the given fileName in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "deleteFile", "fileName": string } }

    response:        { "fileName": string, "deleted": boolean }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName is > 255 characters
    or if the operating system had a problem processing the command.

<br>


#### deleteDirectory - Delete the Directory with the given directoryName in the caller-specific directory (named like the caller's Extension ID)

    command message: { "Command": { "command": "deleteDirectory" [, "directoryName": string] [, "recursive": boolean] } }

                     The directoryName parameter is optional. If not specified,
                     the caller-specific directory (named like the caller's
                     Extension ID) will be deleted. (directoryName is NOT
                     SUPPORTED at this time. Sub-Directories are not supported
                     as this time.)

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

    Sub-Directories are not supported as this time, thus the directoryName parameter is not supported.
    at this time.

<br>


#### listFiles - Return the fileNames of only the Regular Files - not Directories or Other files - in the caller-specific directory (named like the caller's Extension ID), optionally filtering by matching the fileNames to the given GLOB string

    command message: { "Command": { "command": "listFiles" [, "matchGLOB": string] } }

    response:        { "fileNames": [], "length" integer }

    Returns an "invalid" response if the matchGLOB is not a String,
    or if the directory does not exist or is not a Directory,

    Returns an "error" response if the directory's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

    Sub-Directories are not supported as this time, thus a directoryName parameter is not supported.

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

    Sub-Directories are not supported as this time, thus a directoryName parameter is not supported.

<br>


#### list - Return the fileNames of the items (all types - Regular, Directory, and Other) in the caller-specific directory (named like the caller's Extension ID), optionally filtering by matching the fileNames to the given GLOB string

    command message: { "Command": { "command": "list" [, "matchGLOB": string] } }

    response:        { "fileNames": [], "length" integer }

    Returns an "invalid" response if the matchGLOB is not a String,
    or if the directory does not exist or is not a Directory,

    Returns an "error" response if the directory's full pathName is > 255 characters,
    or if the operating system had a problem processing the command.

    Sub-Directories are not supported as this time, thus a directoryName parameter is not supported.

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

    Sub-Directories are not supported as this time, thus a directoryName parameter is not supported.

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


#### isValidFileName - Determine if the given fileName is valid

    command message: { "Command": { "command": "isValidFileName", "fileName": string } }

    response:        { "fileName": string, "valid": boolean }

    Returns an "invalid" response if the fileName parameter is not provided or is not a String.

    The file with the given fileName need not actually exist.  This command merely checks
    if the given string is a valid fileName.

<br>


## How to install (FUTURE):

Head over to [addons.thunderbird.net][ic-mx MABXXX] to find the current
version.  Development releases might be available earlier in the
[Releases] section on GitHub.

  [ic-mx]: MABXXX https://addons.thunderbird.net/addon/file-system-broker/
  [releases]: MABXXX https://github.com/xxx/file-system-broke/releases

<br>



## How to install this Extension from GitHub (FUTURE):

1. Download the .xpi file from GitHub:
    1. MABXXX Go to this page in your browser: https://github.com/WoofGrrrr/file-system-broker/
    2. x
    3. y
2. Open Thunderbird's **Add-ons and Themes** Tab
  + Tools -> Add-ons and Themes
3. Select the **Extensions** Tab on the left
4. Click on the **Gear** icon
5. Select **Install Add-on From File...**
6. Find the file you downloaded from GitHub and double-click on it

<br>



## How to install the latest versions of this Extension from GitHub (FUTURE):

1. Download the .xpi file from GitHub:
    1. MABXXX Go to this page in your browser: https://github.com/WoofGrrrr/file-system-broker/releases xxx
    2. x
    3. y
2. Open Thunderbird's **Add-ons and Themes** Tab
  + Tools -> Add-ons and Themes
3. Select the **Extensions** Tab on the left
4. Click on the **Gear** icon
5. Select **Install Add-on From File...**
6. Find the file you downloaded from GitHub and double-click on it

<br>

## Notes

MABXXX

<br>

## Attribution

This addon uses code from other projects:

  * Internally, this extension uses an enhancement of this extension: \[Thunderbird webext-support\]: https://github.com/thunderbird/webext-support/tree/master/experiments
