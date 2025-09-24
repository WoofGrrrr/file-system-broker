# BrokerFileSystem - A Thunderbird Web Experiments API That Provides Limited Access to The Computer's File System

## Objective

Use this API to access files in the user Thunderbird profile directory.

Until Mozilla has made a final decision about including the
[Chrome FileSystem API](https://web.dev/file-system-access/),
this API can be used as an interim solution.

This API is an enhancement to the original API from the webext-support repository at
[webext-support FileSystem API](https://github.com/thunderbird/webext-support/tree/master/experiments/FileSystem).

It is tailored specifically for the needs of the Experimental FileSystemBroker
Extension in that it uses a given Extension ID as the name of the sub-directory
in the user's Profile Directory rather than that of the ID of the extension
that is actually using the API.

The FileSystemBroker Extension uses Web Extension Inter-Extension Messaging to
receive requests from other extensions to access the File System on their behalf.
This way, those extensions do not need to use the Experiments API directly.

The Messaging system provides the ID of the extension that sends the request
messages, and FileSystemBroker provides those Extension IDs to this API.

This enhancement also provides a number of additional functions.

**Note: Currently does not work with TB78.**


## Usage

MABXXX FIX THIS: Add the [FileSystem API](https://github.com/XXX) to your add-on.

Your `manifest.json` needs an entry like this:

```json
  "experiment_apis": {
    "BrokerFileSystem": {
      "schema": "apis/BrokerFileSystem/schema.json",
      "parent": {
        "scopes": ["addon_parent"],
        "paths": [["BrokerFileSystem"]],
        "script": "apis/BrokerFileSystem/implementation.js"
      }
    }
  },
```

The API uses the following directory for file access:

```
<profile-directory>/BrokerFileSystem/<extension-id>/
```
Where:
  + \<profile-directory\> is the user's profile directory
  + \<extension-id\> is the given Extension ID

<br>

__Sub-directories are currently not supported.__



## The API provides these functions:

  + exists - does a file exist?
  + isRegularFile - does a file exist and is it a Regular file, i.e. NOT a Directory or "other"?
  + isDirectory - does a file exist and is it a Directory, i.e. NOT a Regular file or a a ""other"?
  + hasFiles - does a Directory have any items (Files, Directories, or "Other") in it?
  + getFileCount- how many items (Files, Directories, or "Other") does a Directory have in it?
  + writeFile - write text into a file in file system storage
  + replaceFile - write text into a file in file system storage, replacing any file that already exists
  + appendToFile - write text at the end of a file in file system storage, or create a new file if it does not already exist
  + writeJSONFile - write text into a JSON file in file system storage
  + writeObjectToJSONFile - write JavaScript object as JSON into a JSON file in file system storage
  + readFile - return the contents of a file as a strimg
  + readJSONFile - return the contents of a JSON file as text
  + readObjectFromJSONFile - return the JSON contents of a JSON file as a JavaScript Object
  + makeDirectory - make the directory for the calling extension
  + getFileInfo - return a FileInfo object containing the attributes for a file
  + renameFile - rename a Regular file
  + deleteFile - delete a Regular file
  + deleteDirectory - delete a Directory
  + listFiles - list the fileNames of only Regular files in a directory
  + listFileInfo - list FileInfo ibjects for only the Regular files in a directory
  + list - list fileNames of all items - Reguar files, Directories, and "other" - in a directory
  + listInfo - list FileInfo ibjects for all items - Reguar files, Directories, and "other" - in a directory
  + getFullPathName - return the full system pathName for a file
  + isValidFileName - is a fileName valid?
  + isValidDirectoryName - is a directoryName valid?
  + getFileSystemPathName - return the full pathName of the system directory on which this API operates

### exists(extensionId [, fileName])

    Returns true if a file with the given fileName exists
    in the directory for the extensionId.

    The fileName parameter is optional.  If it is not
    provided, returns true if the directory for the
    given extensionId exists.

    Throws if the extensionId or fileName is invalid,
    or if the file's full pathName is > 255 characters,
    or if there is an operating system error.


### isRegularFile(extensionId, fileName)

    Returns true if a file with the given fileName exists
    in the directory for the given  extensionId and is a
    Regular File, i.e. not a Directory or 'other'.

    Throws if the extensionId or fileName are missing or invalid,
    or if the file's full pathName is > 255 characters,
    or if there is an operating system error.


### isDirectory(extensionId [, directoryName])

    Returns true if a file with the given directoryName exists.
    in the directory for the given extensionId and is a
    Directory, i.e. not a Regular File or 'other'.

    The directoryName parameter is optional.  If not provided,
    returns true if the directory for the given extensionId
    exists and is a Directory.

    Throws if the extensionId or directoryName is invalid,
    or if the directory's full pathName > 255 characters,
    or if there is an operating system error.

    Sub-directories are currently not supported.


### hasFiles(extensionId [, directoryName])

    Returns true if a file with the given directoryName exists
    in the directory for the given extensionId, is a
    Directory, i.e. not a Regular File or 'other',
    and contains files and/or sub-directories.

    The directoryName parameter is optional.  If not provided,
    returns true if the directory for the given extensionId
    exists, is a Directory, and contains files and/or
    sub-directories.

    Throws if the extensionId or directoryName is invalid,
    or if the directory's full pathName > 255 characters,
    of if the file does not exist or is not a Directory,
    or if there is an operating system error.

    Sub-directories are currently not supported.


### getFileCount(extensionId [, directoryName])

    Returns a count of files and/or sub-directories in the
    directory if a file with the given directoryName exists
    in the directory for the given extensionId and is a
    Directory, i.e. not a Regular File or 'other'.

    The directoryName parameter is optional.  If not provided,
    returns the count of files and/or sub-directories in the
    directory if the directory for the given extensionId
    exists and is a Directory.

    Throws if the extensionId or directoryName is invalid,
    or if the directory's full pathName > 255 characters,
    of if the file does not exist or is not a Directory,
    or if there is an operating system error.

    Sub-directories are currently not supported.


### readFile(extensionId, fileName)

    Returns a UTF8-Encoded String for the contents of
    the file with the given fileName in the directory for
    the given extensionId.

    Throws if the extensionId or fileName is invalid,
    if the file's full pathName is > 255 characters,
    or if the file does not exist,
    or if there is an operating system error. 


### readJSONFile(extensionId, fileName)

    Returns a UTF8-encoded string for the contents of the file
    with the given fileName in the directory for the given
    extensionId

    Throws if the extensionId or fileName is invalid,
    if the file's full pathName is > 255 characters,
    or if the file does not exist,
    or if there is an operating system error. 


### readObjectFromJSONFile(extensionId, fileName)

    Returns a JavaScript object for the JSON contents of the file
    with the given fileName in the directory for the given
    extensionId

    Throws if the extensionId or fileName is invalid,
    if the file's full pathName is > 255 characters,
    or if the file does not exist,
    or if there is an operating system error. 


###  writeFile(extensionId, fileName, data [,writeMode])

    Writes the UTF8-Encoded data to the file with the
    given fileName in the directory for the given
    extensionId.

    The optional writeMode parameter has these options:
    - 'overwrite'        (the default)  will replace any existing file or create a new file.
    - 'replace'          a synonymn for 'overwriteY
    - 'append'           will append to the end of an existing file, but will throw if a file with the given fileName does not already exist.
    - 'appendOrCreate'   will append to the end of an existing file or create a new file if a file with the given fileName does not already exist.
    - 'create'           will create a new file if a file with the given fileName does not exist, but will throw if the file already exists.

    Returns the byte count of the data that was written.

    Throws if the extensionId or fileName is invalid,
    or if the file's full pathName > 255 characters,
    or if the writeMode parameter is not one of the values listed above,
    or if the file's existence does not match the writeMode criteria listed above,
    or if there is an operating system error.


###  replaceFile(extensionId, fileName, data)

    Writes the data with UTF-8 encoding into file with the
    given fileName in the directory for the given extensionId,
    replacing any existing file if it already exists.
    (This is the same as using writeFile() with
    writeMode='overwrite' or writeMode='replace'.)

    Returns the byte count of the data that was written.

    Throws if the extensionId or fileName is invalid,
    or if the file's full pathName > 255 characters,
    or if there is an operating system error.


###  appendToFile(extensionId, fileName, data)

    Appends the UTF8-Encoded data to the file with the
    given fileName in the directory for the given
    extensionId, or creates the file and writes the data
    to the file is the file doesn't not already exist.
    (This is the same as using writeFile() with
    writeMode='appendOrCreate'.)

    Returns the byte count of the data that was written.

    Throws if the extensionId or fileName is invalid,
    or if the file's full pathName > 255 characters,
    or if there is an operating system error.


###  writeJSONFile(extensionId, fileName, data [,writeMode])

    Writes the given UTF8-encoded string as JSON to the file with the given
    fileName, in the directory for the given extensionId.

    The optional writeMode parameter has these options:
    - 'overwrite'   (the default) will replace any existing file.
    - 'replace'     a synonym for 'overwrite'
    - 'create'      will create a new file if a file with the given fileName does not exist, but will throw if the file already exists.

    Returns the byte count of the data that was written.

    Throws if the extensionId or fileName is invalid,
    or if the file's full pathName > 255 characters,
    or if the writeMode parameter is not one of the values listed above,
    or if the file's existence does not match the writeMode criteria listed above,
    or if there is an operating system error.


###  writeObjectToJSONFile(extensionId, fileName, object [,writeMode])

    Writes the given JavaScript object as JSON to the file with the given
    fileName, in the directory for the given extensionId.

    The optional writeMode parameter has these options:
    - 'overwrite'   (the default) will replace any existing file.
    - 'replace'     a synonym for 'overwrite'
    - 'create'      will create a new file if a file with the given fileName does not exist, but will throw if the file already exists.

    Returns the byte count of the data that was written.

    Throws if the extensionId or fileName is invalid,
    or if the file's full pathName > 255 characters,
    or if the writeMode parameter is not one of the values listed above,
    or if the file's existence does not match the writeMode criteria listed above,
    or if there is an operating system error.


###  deleteFile(extensionId, fileName)

    Deletes the file with the given fileName in the
    directory for the given extensionId.

    Returns true if the file was deleted,
    or false if the file does not exist.

    Throws if the extensionId or fileName is invalid,
    if the file's full pathName is > 255 characters,
    or if the file is not a Regular File,
    or if there is an operating system error.


###  deleteDirectory(extensionId [, directoryName] [, recursive])

    Deletes the directory with the given directoryName
    in the directory for the given extensionId.

    If recursive is true, the directory and all it's
    contents are deleted. Throws if recursive is false
    or is not provided and the directory is not empty.

    The directoryName parameter is optional.  If it is not
    provided, delete the directory for the given
    extensionId.

    Returns true if the directory was deleted, or false
    if the directory does not exist.

    Throws if the extensionId or directoryName is invalid,
    if the directory's full pathName is > 255 characters,
    or if the directory is not a Directory,
    or if recursive is false or not provided and the directory is not empty,
    or is not provided and the directory is not empty.
    or if there is an operating system error.

    Also throws if the directory is not empty and recursive
    is not true.

    Sub-directories are currently not supported.


###  makeDirectory(extensionId)

    Creates the directory for the given extensionId.

    Returns true if the directory was created, or false
    if the directory already exists.

    Throws if the extensionId is invalid,
    or if the directory's full pathName is > 255 characters,
    or if there is an operating system error.

    Sub-directories are currently not supported, thus a
    directoryName parameter is not currently supported.


###  getFileInfo(extensionId [, fileName])

    Returns a FileInfo object for the file with the given fileName
    or undefined if the file does not exist.

    The fileName parameter is optional.  If it is not
    provided, returns the FileInfo of the directory for the
    given extensionId.

    FileInfo has these entries:
    - fileName:     the fileName
    - path:         the full pathname
    - type:         "regular", "directory", or "other"
    - size:         for a Regular File, the size in bytes, otherwise -1
    - creationTime  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
    - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
    - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
    - permissions:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)

    Throws if the extensionId or fileName is invalid,
    or if the file's full pathName is > 255 characters,
    or if there is an operating system error.


###  renameFile(extensionId, fromFileName, toFileName[, overwrite])

    Renames a Regular file named by fromFileName to toFileName.

    If the optional boolean overwrite parameter is not provided, or if
    it is provided and its value is false, and the file named by toFileName
    already exists, an Exception is thrown.

    Throws if the extensionId, fromFileName, or toFileName is invalid,
    or if a file's full pathName is > 255 characters,
    or if the file named by fromFileName does not exist,
    or if the file named by fromFileName is not a Regular file,
    or if overwrite is not true and the file named by toFileName already exists,
    or if there is an operating system error.



###  listFiles(extensionId [, matchGLOB])

    Returns an array of String listing the fileNames of only
    the Regular Files in the directory for the given extensionId.

    If the optional matchGLOB parameter is given, only
    the names of files that match the given GLOB will
    be returned.

    If the Directory for the extension does not exist, it
    will be created and an empty array is returned. MABXXX WHY???

    Throws if the extensionId is invalid,
    if the directory's full pathName is > 255 characters,
    or if the matchGLOB is provided and is not a String,
    or if there is an operating system error.

    Sub-directories are currently not supported, thus a
    directoryName parameter is not currently supported.


###  listFileInfo(extensionId [, matchGLOB])

    Returns an array of FileInfo objects listing the File Info for only
    the Regular Files in the directory for the given extensionId.

    If the optional matchGLOB parameter is given, only
    the FileInfo for files whose names match the given GLOB will
    be returned.

    If the Directory for the extension does not exist, it
    will be created and an empty array is returned. MABXXX WHY???

    FileInfo has these entries:
    - fileName:     the fileName
    - path:         the full pathname
    - type:         "regular", "directory", or "other"
    - size:         for a Regular File, the size in bytes, otherwise -1
    - creationTime  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
    - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
    - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
    - permissions:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)

    Throws if the extensionId is invalid,
    if the directory's full pathName is > 255 characters,
    or if the matchGLOB is provided and is not a String,
    or if there is an operating system error.

    Sub-directories are currently not supported, thus a
    directoryName parameter is not currently supported.


###  list(extensionId [, matchGLOB])

    Returns an array of String listing the fileNames of the
    items (all types) in the directory for the given extensionId.

    If the optional matchGLOB parameter is given, only
    the names of items that match the given GLOB will
    be returned.

    If the Directory for the extension does not exist, it
    will be created and an empty array is returned. MABXXX WHY???

    Throws if the extensionId is invalid,
    if the directory's full pathName is > 255 characters,
    or if the matchGLOB is provided and is not a String,
    or if there is an operating system error.

    Sub-directories are currently not supported, thus a
    directoryName parameter is not currently supported.


###  listInfo(extensionId [, matchGLOB])

    Returns an array of FileInfo objects listing the File Info for the
    items (all types) in the directory for the given extensionId.

    If the optional matchGLOB parameter is given, only
    the FileInfo for items whose names match the given GLOB will
    be returned.

    If the Directory for the extension does not exist, it
    will be created and an empty array is returned. MABXXX WHY???

    FileInfo has these entries:
    - fileName:     the fileName
    - path:         the full pathname
    - type:         "regular", "directory", or "other"
    - size:         for a Regular File, the size in bytes, otherwise -1
    - creationTime  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
    - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
    - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
    - permissions:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)

    Throws if the extensionId is invalid,
    if the directory's full pathName is > 255 characters,
    or if the matchGLOB is provided and is not a String,
    or if there is an operating system error.

    Sub-directories are currently not supported, thus a
    directoryName parameter is not currently supported.


###  getFullPathName(extensionId [, fileName])

    Returns the Full pathName of the file with the given fileName
    in the directory for the given exxtensionId.

    If the fileName is not provided, returns just the full pathName
    of the directory for the given extensionId.

    Throws if the extensionId or fileName is invalid,
    or if there is an operating system error.


###  isValidFileName(fileName)

    Returns true if the given fileName is a valid file name.


###  isValidDirectoryName(directoryName)

    Returns true if the given directoryName is a valid directory name.

### getFileSystemPathName

    Returns the full pathName of the system directory on which this API operates.
