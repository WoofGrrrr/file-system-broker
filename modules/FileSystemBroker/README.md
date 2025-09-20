# An API for Thunderbird Web Extensions to Access Files on the System

## Objective

This FileSystemBroker API provides a safe way for any Thunderbird Web Extension
to access the computer's file system without having to use an "Experiments API", which
would open up Thunderbird to alllow an extension complete and unrestricted access
to the user's system.

A Thunderbird extension can use this API to access files in a caller-specific
sub-folder in the user's Thunderbird profile folder. All files are thus stored in
a safe place, and files for each extension that uses this API are isolated from
each other.

This API uses the FileSystemBroker Extension as a proxy to access the file system.
(MABXXX PUT REFERNECE TO EXTENSION HERE)

Because the Thunderbird (and Firefox) Web Extensions API does not provide any way to access
a computer's file system, FileSystemBroker itself uses the Web Extensions "Experiments" API
to directly access the file system.  But using this Experiments API requires that an
extension be allowed to access anything and everything on the user's computer, which could
open up the user's computer to inadvertant or even malicious activities, like accessing
sensitive data, deleting files, or downloading and installing programs.

The FileSystemBroker Extension uses Web Extension Inter-Extension Messaging to receive
requests from other extensions to access the file system on their behalf and returns a
message with the results. You must have the FileSystemBroker Extension installed, enabled,
and correctly configured in order to use this API. Yes, an extension may use Inter-Extension
Messaging directly to make use of the FileSystemBroker, but it is thought that this API
makes things easier.

The intent of the FileSystemBroker Extension, then, is to isolate full system access from
other extensions.  Extensions do not need to use the "Experiments" API to access the
computer's file system, so they don't need to be allowed full system privileges and thus be
open to undesired activities.  Those extensions can use this API and the FileSystemBroker
extension instead.

FileSystemBroker uses the following directory for file system access:

    thunderbird-profile-folder/FileSystemBroker/ MABXXX FIX THIS

Each extension that uses FileSystemBroker gets its own sub-directory in this directory,
named using the ID of the extension.



## Usage

MABXXX FIX THIS: Add the [FileSystem API](https://github.com/thunderbird/webext-support/tree/master/experiments/FileSystem) to your add-on.
Your `manifest.json` needs an entry like this:

```json
  "content_scripts": [
    {
      "matches": [ "https://*/*" ],
      "js": [
        "./utilities.js",
        "FileSystemBroker/filesystem_broker_api.js",
      ]
    }
  ]
```
```
import { FileSystemBroker } from '../modules/FileSystemBroker/filesystem_broker_api.js';
```




## Details:

### The API provides these functions:

  + access -                 has the caller been granted permission to access FileSystemBroker?
  + exists -                 does a file exist?
  + isRegularFile -          does a file exist and is it a Regular file, i.e. NOT a Directory or "other"?
  + isDirectory -            does a file exist and is it a Directory, i.e. NOT a Regular file or a a "other"?
  + hasFiles -               does a Directory have files in it?
  + getFileCount -           how many files does a Directory have in it?
  + writeFile -              write text into a file in file system storage
  + replaceFile -            write text into a file in file system storage, replacing any file that already exists
  + appendToFile -           write text at the end of a file in file system storage, or create a new file if it does not already exist
  + writeJSONFile -          write text into a JSON file in file system storage
  + writeObjectToJSONFile -  write a JavaScript object as JSON into a JSON file in file system storage
  + readFile -               return the contents of a file as a strimg
  + readJSONFile -           return the contents of a JSON file as text
  + readObjectFromJSONFile - return the JSON contents of a JSON file as a JavaScript object
  + makeDirectory -          make the directory for the calling extension
  + getFileInfo -            return a FileInfo object containing the attributes for a file
  + renameFile -             rename a Regular file
  + deleteFile -             delete a Regular file
  + deleteDirectory -        delete a Directory
  + listFiles -              list the fileNames of only the Regular files in a directory
  + listFileInfo -           list FileInfo objects for only the Regular files in a directory
  + list -                   list the fileNames of all items - Reguar files, Directories, and "other" files - in a directory
  + listInfo -               list FileInfo objects for all items - Reguar files, Directories, and "other" files - in a directory
  + getFullPathName -        return the full system pathName for a file
  + isValidFileName -        is a fileName valid?
  + getFileSystemPathName -  returns the full pathName of the top-level system directory on which this API operates (in the users profile)


#### All functions are asynchronous (async.) They all return a JavaScript object.

#### In addition to the specific JavasScript object that each function may return, they may all return the following objects:

  + { "invalid": reason } if the function received invalid parameters, where "reason" is a String describing the problem.

  + { "error": reason } if there was an error processing the function, where "reason" is a String describing the problem.

  + { "error": reason, "code": string } if there was a problem with FileSystemBroker, where "reason" is a String describing the problem, and
    + code "400" means that the request to FileSystemBroker is malformed.
    + code "403" means access to FileSystemBroker has been denied.
    + code "404" means that the request to FileSystemBroker is unknown.
    + code "500" means that there was some error that the system does not know how to handle.
    + code "503" means that communcation with FileSystemBroker failed, probably because FileSystemBroker is not installed or is not running.




### About FileNames & DirectoryNames

+ FileNames & DirectoryNames Must be a String with at least one character.

+ ILLEGAL CHARACTERS THAT CANNOT BE USED:
   
      < (less-than)
      > (greater-than)
      : (colon)
      " (quote)
      / (forward slash)
      \ (backward slash)
      | (vertical bar)
      ? (question mark)
      * (asterisk)
      x00-x1F (control characters)
   
+ RESERVED NAMES THAT CANNOT BE USED:

      con
      prn
      aux
      nul
      com0 - com9
      lpt0 - lpt9
   
+ FileNames & DirectoryNames must be NO MORE THAN *64* CHARACTERS in length

+ Full PathNames for Files and Directories must be no more than *255* characters in length




## A Description of Each Function:

### access()

    Determine if the caller is granted permission to access FileSystemBroker.

    Returns:        { "access": string }

    "accces" is "granted" if the caller has permission, "denied" if not.

### exists( [fileName] )

    Returns true if an item (Regular File, Directory, or 'other')
    with the given fileName exists in the directory with the name
    of the ID of the calling extension exists.

    The fileName parameter is optional. If not provided,  this
    function returns true if the directory with the name of the
    ID of the calling extension exists.

    Returns:        { "fileName": string, "exists": boolean }

                    If fileName parameter not specified, the
                    extension ID of the calling extension will
                    be returned as the "fileName" response value.

    Returns an "invalid" response if the fileName parameter is invalid.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the command.

### isRegularFile(fileName)

    Returns true if a file with the given fileName exists
    in the directory with the name of the ID of the calling
    extension exists and is a Regular File, i.e. not a Directory
    or 'other'.

    Returns:        { "fileName": string, "isRegularFile": boolean }

    Returns an "invalid" response if the fileName parameter is missing or invalid.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


### isDirectory( [directoryName] )

    Returns true if a file with the given directoryName exists.
    in the directory for the given and is a Directory, i.e. not a Regular File
    or 'other'.

    The directoryName parameter is optional.  If not provided,
    this function returns true if the directory with the name of
    the ID of the calling extension exists and is a Directory.

    Returns:        { "directoryName": string, "isDirectory": boolean }

                     If directoryName parameter not specified, the extension ID of
                     the calling extension will be returned as the "directoryName"
                     response value.

    Returns an "invalid" response if the directoryName parameter is invalid.

    Returns an "error" response if the directory's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


### hasFiles( [ directoryName] )

    Returns true if a file with the given directoryName exists
    in the directory with the name of the ID of the calling
    extension, is a Directory, i.e. not a Regular File or 'other',
    and contains files and/or sub-directories.

    The directoryName parameter is optional.  If not provided,
    this function returns true if the directory with the name
    of the ID of the calling extension exists, is a Directory,
    and contains files and/or sub-directories.

    Returns:        { "directoryName": string, "hasFiles": boolean }

                     If directoryName parameter not specified, the extension ID of
                     the calling extension will be returned as the "directoryName"
                     response value.

    Returns an "invalid" response if the directoryName parameter is invalid,
    or if the directory does not exist or is not a directory.

    Returns an "error" response if the directory's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


### getFileCount( [directoryName] )

    Returns a count of files and/or sub-directories in the
    directory if a file with the given directoryName exists
    in the directory with the name of the ID  if the calling
    extension and is a Directory, i.e. not a Regular File or
    'other'.

    The directoryName parameter is optional.  If not provided,
    this  function returns the count of files and/or sub-
    directories in the directory if the directory with the
    name of the ID of the calling extension exists and is
    a Directory.

    Returns:        { "directoryName": string, "fileCount": integer }

                     If directoryName parameter not specified, the extension ID of
                     the calling extension will be returned as the "directoryName"
                     response value.

    Returns an "invalid" response if the directoryName parameter is invalid,
    or if the Directory does not exist or is not a Directory.

    Returns an "error" response if the directory's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


### readFile(fileName)

    Returns a UTF8-Encoded String for the contents of the file
    with the given fileName in the directory with the name of
    the ID of the calling extension.

    Returns:        { "fileName": string, "data": UTF8-String }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


### readJSONFile(fileName)

    Returns a UTF8-Encoded String for the contents of the JSON file with
    the given fileName in the directory with the name of the ID of the
    calling extension.

    Returns:        { "fileName": string, "data": UTF8-String }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


### readObjectFromJSONFile(fileName)

    Returns a JavaScript object representing the contents of the
    JSON file with the given fileName in the directory with the
    name of the ID of the calling extension.

    Returns:        { "fileName": string, "object": object }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


###  writeFile(fileName, data [,writeMode])

    Writes the UTF8-Encoded data to the file with the given
    fileName in the directory with the name of the ID of the
    calling extension.

    The optional writeMode parameter has these options:
    - 'overwrite'        (the default) will replace any existing file or create a new file.
    - 'replace'          a synonym for 'overwrite'
    - 'append'           will append to the end of an existing file, but will return an error if a file with the given fileName does not already exist.
    - 'appendOrCreate'   will append to the end of an existing file or create a new file if a file with the given fileName does not already exist.
    - 'create'           will create a new file if a file with the given fileName does not exist, but will return an error if the file already exists.

    Returns:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the data parameter is missing or invalid,
    or if the writeMode parameter is not one of the values listed above,
    or if the existence of the file conflicts with the writeMode as specified above.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


###  replaceFile(fileName, data)

    Writes the data with UTF-8 encoding into file with the given
    fileName in the directory with the name of the ID of the
    calling extension, replacing any existing file if it already
    exists.  (This is the same as using writeFile() with
    writeMode='overwrite' or writeMode='replace'.)

    Returns:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid
    or if the data parameter is missing or invalid.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


###  appendToFile(fileName, data)

    Appends the UTF8-Encoded data to the end of the file with the given
    fileName in the directory with the name of the ID of the
    calling extension, or creates the file and writes the data
    to the file is the file does not already exist.
    (This is the same as using writeFile() with
    writeMode='appendOrCreate'.)

    Returns:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid
    or if the data parameter is missing or invalid.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


###  writeJSONFile(fileName, data [,writeMode])

    Writes the data, a string with UTF-8 encoding, as JSON to the file
    with the given fileName, in the directory with the name of the ID of the
    calling extension.

    The optional writeMode parameter has these options:
    - 'overwrite'   (the default) will replace any existing file.
    - 'replace'     a synonym for 'overwrite'
    - 'create'      will create a new file if a file with the given fileName does not exist, but will return an error if the file already exists.

    Returns:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the data parameter is missing or invalid,
    or if the writeMode parameter is not one of the values listed above,
    or if the existence of the file conflicts with the writeMode as specified above.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


###  writeObjectToJSONFile(fileName, object [,writeMode])

    Writes object, a JavaScript object, as JSON to the file with
    the given fileName, in the directory with the name of the
    ID of the calling extension.

    The optional writeMode parameter has these options:
    - 'overwrite'   (the default) will replace any existing file.
    - 'replace'     a synonym for 'overwrite'
    - 'create'      will create a new file if a file with the given fileName does not exist, but will return an error if the file already exists.

    Returns:        { "fileName": string, "bytesWritten": integer }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the object parameter is missing or invalid,
    or if the writeMode parameter is not one of the values listed above,
    or if the existence of the file conflicts with the writeMode as specified above.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


###  deleteFile(fileName)

    Deletes the file with the given fileName in the directory
    with the name of the ID of the calling extension.

    Returns:        { "fileName": string, "deleted": boolean }

    Returns an "invalid" response if the fileName parameter is missing or invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


###  deleteDirectory( [directoryName] [, recursive] )

    Deletes the directory with the given directoryName in the
    directory with the name of the ID of the calling extension.

    If recursive is true, the directory and all it's
    contents are deleted. Returns { "invalid" } if recursive is false
    or is not provided and the directory is not empty.

    The directoryName parameter is optional.  If it is not
    provided, delete the directory with the name of the ID
    of the calling extension.

    Returns:        { "directoryName": string, "deleted": boolean }

                     If directoryName parameter not specified, the extension ID of
                     the calling extension will be returned as the "directoryName"
                     response value.

    Returns an "invalid" response if the directoryName parameter is invalid,
    or if the directory does not exist,
    or if it is not actually a Directory,
    or if the directory contains files and/or sub-directories and the recursive parameter is not true.

    Returns an "error" response if the directory's full pathName
    is > 255 characters, or if the operating system had a problem
    processing the function.


###  makeDirectory()

    Creates the directory with the name of the ID of the calling extension.

    Returns:        { "directoryName": string, "created": boolean }

    Returns an "invalid" response if a file or directory with the name of the caller's Extension ID already exists.

    Returns an "error" response if the directory's full pathName
    is > 255 characters, or if the operating system had a problem
    processing the function.


###  getFileInfo( [fileName] )

    Returns the FileInfo for the file with the given fileName
    or undefined if the file does not exist.

    The fileName parameter is optional.  If it is not provided,
    this function returns the FileInfo of the directory with the name
    of the ID of the calling extension.

    FileInfo has these entries:
    - fileName:     the fileName
    - path:         the full pathname
    - type:         "regular", "directory", or "other"
    - size:         for a Regular File, the size in bytes, otherwise -1
    - creationTime  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
    - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
    - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
    - permissions:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)

    Returns:        { "fileName": string, "fileInfo": FileInfo or undefined  }

                     If fileName parameter not specified, the extension ID of
                     the calling extension will be returned as the "fileName"
                     response value.

    Returns an "invalid" response if the fileName parameter is invalid,
    or if the file does not exist.

    Returns an "error" response if the file's full pathName
    is > 255 characters or if the operating system had a problem
    processing the function.


###  renameFile( fromFileName, toFileName[, overwrite] )

    Renames a regular file.

    The overwrite parameter is optional. The default is false. If it is not provided,
    or if it is provided and it is not true, and if the file named by toFileName already
    exists an "invalid" response is returned.

    Returns:        { "fromFileName": string, "toFileName": string, "renamed": boolean  }

    Returns an "invalid" response if either fileName is invalid,
    or if the the file named fromFileName does not exist or is not a Regular File (is a Directory or "Other",)
    or if the optional overwrite parameter is not boolean,
    or if the overwrite parameter is not true and the file named by toFileName already exists.

    Returns an "error" response if either file's full pathName is > 255 characters,
    or if the operating system had a problem processing the function.


###  listFiles( [matchGLOB] )

    Returns an array of String listing the fileNames of only the
    Regular Files in the directory with the name of the ID of
    the calling extension.

    If the optional matchGLOB parameter is given, only
    the names of files that match the given GLOB will
    be returned.

    If the Directory for the extension does not exist, it
    is created and an empty array is returned. MABXXX WHY???
    (Before the makeDirectory() function was added, this was
    the only way to create the directory.)

    Returns:        { "fileNames": [], "length" integer }

    Returns an "invalid" response if the matchGLOB is not a String,
    or if the directory does not exist or is not a Directory,

    Returns an "error" response if the directory's full pathName
    is > 255 characters, or if the operating system had a problem
    processing the function.


###  listFileInfo( [matchGLOB] )

    Returns an array of FileInfo listing the FileInfo of only the
    Regular Files in the directory with the name of the ID of
    the calling extension.

    If the optional matchGLOB parameter is given, only
    the FileInfo for files that match the given GLOB will
    be returned.

    If the Directory for the extension does not exist, it
    is created and an empty array is returned. MABXXX WHY???
    (Before the makeDirectory() function was added, this was
    the only way to create the directory.)

    Returns:        { "fileInfo": [], "length" integer }

    Returns an "invalid" response if the matchGLOB is not a String,
    or if the directory does not exist or is not a Directory,

    Returns an "error" response if the directory's full pathName
    is > 255 characters, or if the operating system had a problem
    processing the function.

    FileInfo has these entries:
    - fileName:     the fileName
    - path:         the full pathname
    - type:         "regular", "directory", or "other"
    - size:         for a Regular File, the size in bytes, otherwise -1
    - creationTime  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
    - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
    - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
    - permissions:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)


###  list( [ matchGLOB] )

    Returns an array of String listing the fileNames of all items
    (any type - Regular, Directory, or Other) in the directory with
    the name of the ID of the calling extension.

    If the optional matchGLOB parameter is given, only
    the names of items that match the given GLOB will
    be returned.

    If the Directory for the extension does not exist, it
    will be created and an empty arra is returned. MABXXX WHY???
    (Before the makeDirectory() function was added, this was
    the only way to create the directory.)

    Returns:        { "fileNames": [], "length" integer }

    Returns an "invalid" response if the matchGLOB is not a String,
    or if the directory does not exist or is not a Directory,

    Returns an "error" response if the directory's full pathName
    is > 255 characters, or if the operating system had a problem
    processing the function.


###  listInfo( [ matchGLOB] )

    Returns an array of FileInfo listing the FileInfo for all items
    (any type - Regular, Directory, or Other) in the directory with
    the name of the ID of the calling extension.

    If the optional matchGLOB parameter is given, only
    the FileInfo for items that match the given GLOB will
    be returned.

    If the Directory for the extension does not exist, it
    will be created and an empty arra is returned. MABXXX WHY???
    (Before the makeDirectory() function was added, this was
    the only way to create the directory.)

    Returns:        { "fileInfo": [], "length" integer }

    Returns an "invalid" response if the matchGLOB is not a String,
    or if the directory does not exist or is not a Directory,

    Returns an "error" response if the directory's full pathName
    is > 255 characters, or if the operating system had a problem
    processing the function.

    FileInfo has these entries:
    - fileName:     the fileName
    - path:         the full pathname
    - type:         "regular", "directory", or "other"
    - size:         for a Regular File, the size in bytes, otherwise -1
    - creationTime  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
    - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
    - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
    - permissions:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)


###  getFullPathName( [fileName] )

    Returns the Full pathName of the file with the given fileName
    in the directory for the given extensionId. (The file need
    not actually exist.)

    If the fileName is not provided, this function returns just
    the full pathName of the directory with the name of the ID
    of the calling extension.

    Returns:        { "fileName": string, "fullPathName": string }

                     If fileName parameter not specified, the extension ID of
                     the calling extension will be returned as the "fileName"
                     response value.

    Returns an "invalid" response if the fileName parameter is invalid.


###  isValidFileName(fileName)

    Returns true if the given fileName is a valid file name.
    (The file need not actually exist.)

    Returns:        { "fileName": string, "valid": boolean }

    Returns an "invalid" response if the fileName parameter is not provided or is not a String.


###  getFileSystemPathName()

    Returns the full pathName of the system directory on which this API operates.

    Returns:        { "pathName": string }
