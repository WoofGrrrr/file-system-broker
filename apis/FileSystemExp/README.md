# FileSystemExp - A Thunderbird Web Experiments API That Provides Limited Access to The Computer's File System

Use this API to access files in the Thunderbird user profile directory/folder.

Until Mozilla has made a final decision about including the
[Chrome FileSystem API](https://web.dev/file-system-access/),
this API can be used as an interim solution.  (Actually, it
appears that the people at Mozilla may have decided not to
implement the Chrome FileSystem API.)

This API is an enhancement to the original API from the webext-support repository at
[webext-support FileSystem API](https://github.com/thunderbird/webext-support).

This enhancement provides a number of additional functions and features.

As an "Experiments API", in order to use it, it requires that you accept granting
full access to your system to Thunderbird.  This is considered by many to compromise
a computer's security.

I have provided this API for those extension developers who may already need to use the
Experiements API for other purposes.

If, as an extension developer, you don't wish to compromise security, or you have no
other need to use the Experiements API, you can instead use the
[FileSystemBroker Extension](https://github.com/WoofGrrrr/file-system-broker)
and its
[FileSystemBroker API](https://github.com/WoofGrrrr/file-system-broker/tree/main/modules/FileSystemBroker).

With the FileSystemBroker Extension and its API, you can write an extension that can
access the computer's file system without having to use the Experiments API and thus
requiring your extension's users to grant full system access to your extension.  You
can simply use the FileSystemBroker API, and let it use the FileSystemBroker Extension
to to the files system access on your extension's behalf.

The API uses inter-extension messaging to request services from the extension. The API
sends a message to the extension, the extension receives the message and performs the
requested command, and finally responds with another message with the results of the
command.

**Note: Currently does not work with TB78.**


## How to Use the FileSystemBroker API

* Add the [FileSystemExp API](https://github.com/WoofGrrrr/file-system-broker/tree/main/apis/BrokerFileSystemExp)
to your add-on.

* Download the directory and its contents and copy them into the `"apis"` sub-directory for your extension

* Your extension's `manifest.json` file needs an entry like this:

```json
  "experiment_apis": {
    "FileSystemExp": {
      "schema": "apis/FileSystemExp/schema.json",
      "parent": {
        "scopes": ["addon_parent"],
        "paths": [["FileSystemExp"]],
        "script": "apis/FileSystemExp/implementation.js"
      }
    }
  },
```

* In your extension's JavaScript code, you use the API just like any other Web Extension API...

```
  const valid = await messenger.FileSystemExp.isValidFileName("file1.txt");
```
<br>
<br>

### The API uses the following directory/folder for file access:

```
<profile-directory>/FileSystemExp/<extension-id>/
```
Where:
  + \<profile-directory\> is the user's profile directory/folder
  + \<extension-id\> is the Extension ID of the extension using the API

On a Windows system, if the User ID of the user using Thunderbird were "user1",
and if the ID of your extension were "aaa.bbb@xxx.com", the pathName of this
directory would be something like this:
> C:\Users\user1\AppData\Roaming\Thunderbird\Profiles\4x4rl22v.default-release\FileSystemExp\aaa.bbb@xxx.com

<br>

__Sub-directories are not currently supported.__

<br>
<br>

## The API provides these functions:

  + exists - does a file exist?
  + isRegularFile - does a file exist and is it a Regular file, i.e. NOT a Directory or "other"?
  + isDirectory - does a file exist and is it a Directory, i.e. NOT a Regular file or "other"?
  + hasFiles - does a Directory contains any items (Files, Directories, or "Other") in it?
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

### exists( [ fileName] )

    Returns true if a file with the given fileName exists
    in the directory for the extension.

    The fileName parameter is optional.  If it is not
    provided, returns true if the directory for the
    calling extension exists.

    Throws if the fileName is invalid,
    or if the file's full pathName is > 255 characters,
    or if there is an operating system error.


### isRegularFile(fileName)

    Returns true if a file with the given fileName exists
    in the directory for the calling  extension and is a
    Regular File, i.e. not a Directory or 'other'.

    Throws if the fileName is missing or invalid,
    or if the file's full pathName is > 255 characters,
    or if there is an operating system error.


### isDirectory( [directoryName] )

    Returns true if a file with the given directoryName exists.
    in the directory for the calling extension and is a
    Directory, i.e. not a Regular File or 'other'.

    The directoryName parameter is optional.  If not provided,
    returns true if the directory for the calling extension
    exists and is a Directory.

    Throws if the directoryName is invalid,
    or if the directory's full pathName > 255 characters,
    or if there is an operating system error.

    Sub-directories are currently not supported.


### hasFiles( [directoryName] )

    Returns true if a file with the given directoryName exists
    in the directory for the calling extension, is a
    Directory, i.e. not a Regular File or 'other',
    and contains files and/or sub-directories.

    The directoryName parameter is optional.  If not provided,
    returns true if the directory for the calling extension
    exists, is a Directory, and contains files and/or
    sub-directories.

    Throws if the directoryName is invalid,
    or if the directory's full pathName > 255 characters,
    of if the file does not exist or is not a Directory,
    or if there is an operating system error.

    Sub-directories are currently not supported.


### getFileCount( [directoryName] )

    Returns a count of files and/or sub-directories in the
    directory if a file with the given directoryName exists
    in the directory for the calling extension and is a
    Directory, i.e. not a Regular File or 'other'.

    The directoryName parameter is optional.  If not provided,
    returns the count of files and/or sub-directories in the
    directory if the directory for the calling extension
    exists and is a Directory.

    Throws if the directoryName is invalid,
    or if the directory's full pathName > 255 characters,
    of if the file does not exist or is not a Directory,
    or if there is an operating system error.

    Sub-directories are currently not supported.


### readFile(fileName)

    Returns a UTF8-Encoded String for the contents of
    the file with the given fileName in the directory for
    the calling extension.

    Throws if the fileName is invalid,
    if the file's full pathName is > 255 characters,
    or if the file does not exist,
    or if there is an operating system error. 


### readJSONFile(fileName)

    Returns a UTF8-encoded string for the contents of the file
    with the given fileName in the directory for the calling
    extension

    Throws if the fileName is invalid,
    if the file's full pathName is > 255 characters,
    or if the file does not exist,
    or if there is an operating system error. 


### readObjectFromJSONFile(fileName)

    Returns a JavaScript object for the JSON contents of the file
    with the given fileName in the directory for the calling
    extension

    Throws if the fileName is invalid,
    if the file's full pathName is > 255 characters,
    or if the file does not exist,
    or if there is an operating system error. 


###  writeFile(fileName, data [,writeMode])

    Writes the UTF8-Encoded data to the file with the
    given fileName in the directory for the calling
    extension.

    The optional writeMode parameter has these options:
    - 'overwrite'        (the default)  will replace any existing file or create a new file.
    - 'replace'          a synonymn for 'overwriteY
    - 'append'           will append to the end of an existing file, but will throw if a file with the given fileName does not already exist.
    - 'appendOrCreate'   will append to the end of an existing file or create a new file if a file with the given fileName does not already exist.
    - 'create'           will create a new file if a file with the given fileName does not exist, but will throw if the file already exists.

    Returns the byte count of the data that was written.

    Throws if the fileName is invalid,
    or if the file's full pathName > 255 characters,
    or if the writeMode parameter is not one of the values listed above,
    or if the file's existence does not match the writeMode criteria listed above,
    or if there is an operating system error.


###  replaceFile(fileName, data)

    Writes the data with UTF-8 encoding into file with the
    given fileName in the directory for the calling extension,
    replacing any existing file if it already exists.
    (This is the same as using writeFile() with
    writeMode='overwrite' or writeMode='replace'.)

    Returns the byte count of the data that was written.

    Throws if the fileName is invalid,
    or if the file's full pathName > 255 characters,
    or if there is an operating system error.


###  appendToFile(fileName, data)

    Appends the UTF8-Encoded data to the file with the
    given fileName in the directory for the calling
    extension, or creates the file and writes the data
    to the file is the file doesn't not already exist.
    (This is the same as using writeFile() with
    writeMode='appendOrCreate'.)

    Returns the byte count of the data that was written.

    Throws if the fileName is invalid,
    or if the file's full pathName > 255 characters,
    or if there is an operating system error.


###  writeJSONFile(fileName, data [,writeMode])

    Writes the given UTF8-encoded string as JSON to the file with the given
    fileName, in the directory for the calling extension.

    The optional writeMode parameter has these options:
    - 'overwrite'   (the default) will replace any existing file.
    - 'replace'     a synonym for 'overwrite'
    - 'create'      will create a new file if a file with the given fileName does not exist, but will throw if the file already exists.

    Returns the byte count of the data that was written.

    Throws if the fileName is invalid,
    or if the file's full pathName > 255 characters,
    or if the writeMode parameter is not one of the values listed above,
    or if the file's existence does not match the writeMode criteria listed above,
    or if there is an operating system error.


###  writeObjectToJSONFile(fileName, object [,writeMode])

    Writes the given JavaScript object as JSON to the file with the given
    fileName, in the directory for the calling extension.

    The optional writeMode parameter has these options:
    - 'overwrite'   (the default) will replace any existing file.
    - 'replace'     a synonym for 'overwrite'
    - 'create'      will create a new file if a file with the given fileName does not exist, but will throw if the file already exists.

    Returns the byte count of the data that was written.

    Throws if the fileName is invalid,
    or if the file's full pathName > 255 characters,
    or if the writeMode parameter is not one of the values listed above,
    or if the file's existence does not match the writeMode criteria listed above,
    or if there is an operating system error.


###  deleteFile(fileName)

    Deletes the file with the given fileName in the
    directory for the calling extension.

    Returns true if the file was deleted,
    or false if the file does not exist.

    Throws if the fileName is invalid,
    if the file's full pathName is > 255 characters,
    or if the file is not a Regular File,
    or if there is an operating system error.


###  deleteDirectory( [directoryName] [, recursive] )

    Deletes the directory with the given directoryName
    in the directory for the calling extension.

    If recursive is true, the directory and all it's
    contents are deleted. Throws if recursive is false
    or is not provided and the directory is not empty.

    The directoryName parameter is optional.  If it is not
    provided, delete the directory for the calling
    extension.

    Returns true if the directory was deleted, or false
    if the directory does not exist.

    Throws if the directoryName is invalid,
    if the directory's full pathName is > 255 characters,
    or if the directory is not a Directory,
    or if recursive is false or not provided and the directory is not empty,
    or is not provided and the directory is not empty.
    or if there is an operating system error.

    Also throws if the directory is not empty and recursive
    is not true.

    Sub-directories are currently not supported.


###  makeDirectory()

    Creates the directory for the calling extension.

    Returns true if the directory was created, or false
    if the directory already exists.

    Throws if the directory's full pathName is > 255 characters,
    or if there is an operating system error.

    Sub-directories are currently not supported, thus a
    directoryName parameter is not currently supported.


###  getFileInfo( [fileName] )

    Returns a FileInfo object for the file with the given fileName
    or undefined if the file does not exist.

    The fileName parameter is optional.  If it is not
    provided, returns the FileInfo of the directory for the
    calling extension.

    FileInfo has these entries:
    - fileName:     the fileName
    - path:         the full pathname
    - type:         "regular", "directory", or "other"
    - size:         for a Regular File, the size in bytes, otherwise -1
    - creationTime  (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
    - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
    - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
    - permissions:  expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)

    Throws if the fileName is invalid,
    or if the file's full pathName is > 255 characters,
    or if there is an operating system error.


###  renameFile(fromFileName, toFileName[, overwrite])

    Renames a Regular file named by fromFileName to toFileName.

    If the optional boolean overwrite parameter is not provided, or if
    it is provided and its value is false, and the file named by toFileName
    already exists, an Exception is thrown.

    Throws if the fromFileName or toFileName is invalid,
    or if a file's full pathName is > 255 characters,
    or if the file named by fromFileName does not exist,
    or if the file named by fromFileName is not a Regular file,
    or if overwrite is not true and the file named by toFileName already exists,
    or if there is an operating system error.

###  listFiles( [matchGLOB] )

    Returns an array of String listing the fileNames of only
    the Regular Files in the directory for the calling extension.

    If the optional matchGLOB parameter is given, only
    the names of files that match the given GLOB will
    be returned.

    If the Directory for the extension does not exist, it
    will be created and an empty array is returned. MABXXX WHY???

    Throws if the directory's full pathName is > 255 characters,
    or if the matchGLOB is provided and is not a String,
    or if there is an operating system error.

    Sub-directories are currently not supported, thus a
    directoryName parameter is not currently supported.


###  listFileInfo( [matchGLOB] )

    Returns an array of FileInfo objects listing the File Info for only
    the Regular Files in the directory for the calling extension.

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

    Throws if the directory's full pathName is > 255 characters,
    or if the matchGLOB is provided and is not a String,
    or if there is an operating system error.

    Sub-directories are currently not supported, thus a
    directoryName parameter is not currently supported.


###  list( [matchGLOB] )

    Returns an array of String listing the fileNames of the
    items (all types) in the directory for the calling extension.

    If the optional matchGLOB parameter is given, only
    the names of items that match the given GLOB will
    be returned.

    If the Directory for the extension does not exist, it
    will be created and an empty array is returned. MABXXX WHY???

    Throws if the directory's full pathName is > 255 characters,
    or if the matchGLOB is provided and is not a String,
    or if there is an operating system error.

    Sub-directories are currently not supported, thus a
    directoryName parameter is not currently supported.


###  listInfo( [matchGLOB] )

    Returns an array of FileInfo objects listing the File Info for the
    items (all types) in the directory for the calling extension.

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

    Throws if the directory's full pathName is > 255 characters,
    or if the matchGLOB is provided and is not a String,
    or if there is an operating system error.

    Sub-directories are currently not supported, thus a
    directoryName parameter is not currently supported.


###  getFullPathName( [fileName] )

    Returns the Full pathName of the file with the given fileName
    in the directory for the calling extension.

    If the fileName is not provided, returns just the full pathName
    of the directory for the calling extension.

    Throws if the fileName is invalid,
    or if there is an operating system error.


###  isValidFileName(fileName)

    Returns true if the given fileName is a valid file name.


###  isValidDirectoryName(directoryName)

    Returns true if the given directoryName is a valid directory name.

### getFileSystemPathName

    Returns the full pathName of the system directory on which this API operates.
