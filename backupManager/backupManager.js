import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { FsbOptions          } from '../modules/options.js';
import { Logger              } from '../modules/logger.js';
import { getI18nMsg, formatMsToDateTime24HR , formatMsToDateTime12HR } from '../modules/utilities.js';




class BackupManager {
  constructor() {
    this.className     = this.constructor.name;

    this.INFO          = false;
    this.LOG           = false;
    this.DEBUG         = false;
    this.WARN          = false;

    this.logger        = new Logger();
    this.fsbOptionsApi = new FsbOptions(this.logger);

    this.canceled      = false;


    this.listHeaderTextFileName                 = getI18nMsg( "fsbBackupManager_listHeader_fileName",             "File Name"          );
    this.listHeaderTextFileCreationDateTime     = getI18nMsg( "fsbBackupManager_listHeader_fileTimeCreated",      "Time Created"       );
    this.listHeaderTextFileLastModifiedDateTime = getI18nMsg( "fsbBackupManager_listHeader_fileTimeLastModified", "Time Last Modified" );
    this.listHeaderTextFileSize                 = getI18nMsg( "fsbBackupManager_listHeader_fileSize",             "Size (bytes)"       );
  }



  info(...info) {
    if (this.INFO) this.logger.info(this.className, ...info);
  }

  infoAlways(...info) {
    this.logger.infoAlways(this.className, ...info);
  }

  log(...info) {
    if (this.LOG) this.logger.log(this.className, ...info);
  }

  logAlways(...info) {
    this.logger.logAlways(this.className, ...info);
  }

  debug(...info) {
    if (this.DEBUG) this.logger.debug(this.className, ...info);
  }

  debugAlways(...info) {
    this.logger.debugAlways(this.className, ...info);
  }

  warn(...info) {
    if (this.WARN) this.logger.warn(this.className, ...info);
  }

  warnAlways(...info) {
    this.logger.warnAlways(this.className, ...info);
  }

  error(...info) {
    // always log errors
    this.logger.error(this.className, ...info);
  }
  
  caught(e, msg, ...info) {
    // always log exceptions
    this.logger.error( this.className,
                       msg,
                       "\n- name:    " + e.name,
                       "\n- message: " + e.message,
                       "\n- stack:   " + e.stack,
                       ...info
                     );
  }



  async run(e) {
    this.debug("-- begin");

    ////window.onbeforeunload = (e) => this.windowUnloading(e);
    window.addEventListener("beforeunload", (e) => this.windowUnloading(e));

    const showInstructions = await this.fsbOptionsApi.isEnabledShowBackupManagerInstructions();
    this.showHideInstructions(showInstructions);

    await this.updateOptionsUI();
    await this.updateBackupFilesDirectoryUI();
    await this.localizePage();
    await this.buildFileNameListUI();
    this.setupEventListeners();
  }



  setupEventListeners() {
    document.addEventListener( "change", (e) => this.optionChanged(e) );   // One of the checkboxes or radio buttons was clicked or a select has changed

    const backupBtn = document.getElementById("fsbBackupManagerBackupButton");
    backupBtn.addEventListener("click", (e) => this.backupButtonClicked(e));

    const restoreBtn = document.getElementById("fsbBackupManagerRestoreButton");
    restoreBtn.addEventListener("click", (e) => this.restoreButtonClicked(e));

    const deleteBtn = document.getElementById("fsbBackupManagerDeleteButton");
    deleteBtn.addEventListener("click", (e) => this.deleteButtonClicked(e));

    const doneBtn = document.getElementById("fsbBackupManagerDoneButton");
    doneBtn.addEventListener("click", (e) => this.doneButtonClicked(e));
  }



  async localizePage() {
    this.debug("-- start");

    for (const el of document.querySelectorAll("[data-l10n-id]")) {
      const id = el.getAttribute("data-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if (i18nMessage == "") {
        i18nMessage = id;
      }
      el.textContent = i18nMessage;
    }

    for (const el of document.querySelectorAll("[data-html-l10n-id]")) {
      const id = el.getAttribute("data-html-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if (i18nMessage == "") {
        i18nMessage = id;
      }
      el.insertAdjacentHTML('afterbegin', i18nMessage);
    }

    this.debug("-- end");
  }



  async updateOptionsUI() {
    this.debug("-- start");

    const options = await this.fsbOptionsApi.getAllOptions();

    this.debug("-- sync options to UI");
    for (const [optionName, optionValue] of Object.entries(options)) {
      this.debug("-- option: ", optionName, "value: ", optionValue);

      if (this.fsbOptionsApi.isDefaultOption(optionName)) { // MABXXX WHY WHY WHY???
        const optionElement = document.getElementById(optionName);

        if (optionElement && optionElement.classList.contains("fsbGeneralOption")) {
          if (optionElement.tagName === 'INPUT') {
            if (optionElement.type === 'checkbox') {
              optionElement.checked = optionValue;
            } else if (optionElement.type === 'radio') {
              optionElement.value = optionValue;
            } else if (optionElement.type === 'text') {
              // MABXXX we don't handle this yet...
              optionElement.value = optionValue;
            }
          } else if (optionElement.tagName === 'SELECT') {
            optionElement.value = optionValue;
          }
        }
      }
    }

    this.debug("-- end");
  }



  // One of the Options checkboxes or radio buttons (etc) has been clicked or a select has changed
  //
  // copied from optionsUI.js, so this does a lot that we don't really need for now.
  async optionChanged(e) {
    if (e == null) return;
    this.debug(`-- tagName="${e.target.tagName}" type="${e.target.type}" fsbGeneralOption? ${e.target.classList.contains("fsbGeneralOption")} id="${e.target.id}"`);

    var target = e.target;
    if ( target.tagName == "INPUT"
         && target.classList.contains("fsbGeneralOption")
         && ( target.type == "checkbox"
              || target.type == "radio"
            )
       )
    {
      const optionName  = target.id;
      const optionValue = target.checked;

      /* if it's a radio button, set the values for all the other buttons in the group to false */
      if (target.type == "radio") { // is it a radio button?
        this.debug(`-- radio buttton selected ${optionName}=<${optionValue}> - group=${target.name}`);

        // first, set this option
        this.debug(`-- Setting Radio Option {[${optionName}]: ${optionValue}}`);
        await this.fsbOptionsApi.storeOption(
          { [optionName]: optionValue }
        );

        // get all the elements with the same name, and if they're a radio, un-check them
        if (target.name) { /* && (optionValue == true || optionValue == 'true')) { Don't need this. Event fired *ONLY* when SELECTED, i.e. true */
          const radioGroupName = target.name;
          const radioGroup = document.querySelectorAll(`input[type="radio"][name="${radioGroupName}"]`);
          if (! radioGroup) {
            this.debug('-- no radio group found');
          } else {
            this.debug(`-- radio group members length=${radioGroup.length}`);
            if (radioGroup.length < 2) {
              this.debug('-- no radio group members to reset (length < 2)');
            } else {
              for (const radio of radioGroup) {
                if (radio.id != optionName) { // don't un-check the one that fired
                  this.debug(`-- resetting radio button {[${radio.id}]: false}`);
                  await this.fsbOptionsApi.storeOption(
                    { [radio.id]: false }
                  );
                }
              }
            }
          }
        }
      } else { // since we already tested for it, it's got to be a checkbox
        this.debug(`-- Setting Checkbox Option {[${optionName}]: ${optionValue}}`);
        await this.fsbOptionsApi.storeOption(
          { [optionName]: optionValue }
        );

        // special processing for these checkboxes
        switch (optionName) {
          case "fsbShowBackupManagerInstructions": 
            this.showHideInstructions(optionValue);
            break;
        }
      }
    } else if ( target.tagName === 'SELECT'
                && target.classList.contains("fsbGeneralOption")
              )
    {
      const optionName  = target.id;
      const optionValue = target.value;

      this.debug(`-- Setting Select Option {[${optionName}]: ${optionValue}}`);
      await this.fsbOptionsApi.storeOption(
        { [optionName]: optionValue }
      );
    }
  }



  showHideInstructions(show) {
    this.debug(`-- show=${show}`);
    const panel = document.getElementById("fsbBackupManagerInstructions");
    if (panel) {
      if (show) {
        panel.style.setProperty('display', 'block');
      } else {
        panel.style.setProperty('display', 'none');
      }
    }
  }
  


  async updateBackupFilesDirectoryUI() {
    const backupFilesDirectoryPathNameLabel = document.getElementById("fsbBackupFilesDirectoryPathName");
    const fsBrokerApi                       = new FileSystemBrokerAPI();
    const response                          = await fsBrokerApi.getFullPathName(); // MABXXX perhaps this should come from fsbOptionsApi???

    if (response && response.fullPathName) {
      backupFilesDirectoryPathNameLabel.textContent = response.fullPathName;
    } else {
      backupFilesDirectoryPathNameLabel.textContent = "???";
    }
  }
  


  async windowUnloading(e) {
    if (this.DEBUG) this.debugAlways( "--- Window Unloading ---"
                                      + `\n- window.screenTop=${window.screenTop}`
                                      + `\n- window.screenLeft=${window.screenLeft}`
                                      + `\n- window.outerWidth=${window.outerWidth}`
                                      + `\n- window.outerHeight=${window.outerHeight}`
                                      + `\n- this.canceled=${this.canceled}`
                                    );
    await this.fsbOptionsApi.storeWindowBounds("backupManagerWindowBounds", window);

    if (this.DEBUG) {
      let bounds = await this.fsbOptionsApi.getWindowBounds("backupManagerWindowBounds");

      if (! bounds) {
        this.debugAlways("--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- FAILED TO GET Backup Manager Window Bounds ---");
      } else if (typeof bounds !== 'object') {
        this.debugAlways(`--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- Backup Manager Window Bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
      } else {
        this.debugAlways( "--- Retrieve Stored Window Bounds ---"
                          + `\n- bounds.top:    ${bounds.top}`
                          + `\n- bounds.left:   ${bounds.left}`
                          + `\n- bounds.width:  ${bounds.width}`
                          + `\n- bounds.height: ${bounds.height}`
                        );
      }
    }

    // Tell Thunderbird to close the window
    e.returnValue = '';  // any "non-truthy" value will do
    return false;
  }



  async buildFileNameListUI() {
    const domFileNameList = document.getElementById("fsbBackupManagerFileNameList");
    if (! domFileNameList) {
      this.debug("-- failed to get domFileNameList");
      // MABXXX DISPLAY MESSAGE TO USER
      return;
    }

    domFileNameList.innerHTML = '';
    this.updateUIOnSelectionChanged();

    const i18nMessage = getI18nMsg("fsbBackupManager_message_fileNamesLoading", "...");
    const loadingTR = document.createElement("tr");
    loadingTR.classList.add("identities-loading");
    loadingTR.appendChild( document.createTextNode(i18nMessage) ); // you can put a text node in a TR ???
    domFileNameList.appendChild(loadingTR);

    const backupFileInfo = await this.getBackupFileInfo();

    domFileNameList.innerHTML = '';

    const headerItemUI = this.buildFileNameListHeaderUI();
    domFileNameList.append(headerItemUI);

    if (! backupFileInfo) {
      // MABXXX
    } else if (backupFileInfo.length < 1) {
      // MABXXX
    } else {
      for (const fileInfo of backupFileInfo) {
        const listItemUI = this.buildFileNameListItemUI(fileInfo);
        domFileNameList.append(listItemUI);
      }
    }
  }



  buildFileNameListHeaderUI() {
    this.debug("-- BUILD LIST HEADER UI");

    const fileNameItemTR = document.createElement("tr");
      fileNameItemTR.classList.add("filename-list-header");             // filename-list-header

      // Create FileName element and add it to the row
      const fileNameTH = document.createElement("th");
        fileNameTH.classList.add("filename-list-header-data");          // filename-list-header > filename-list-header-data
        fileNameTH.classList.add("filename-list-header-filename");      // filename-list-header > filename-list-header-filename
        fileNameTH.appendChild( document.createTextNode(this.listHeaderTextFileName) );
      fileNameItemTR.appendChild(fileNameTH);

      // Create Creation Date/Time element and add it to the row
      const creationTimeTH = document.createElement("th");
        creationTimeTH.classList.add("filename-list-header-data");               // filename-list-header > filename-list-header-data
        creationTimeTH.classList.add("filename-list-header-time-last-modified"); // filename-list-header > filename-list-header-time-last-modified
        creationTimeTH.appendChild( document.createTextNode(this.listHeaderTextFileCreationDateTime) );
      fileNameItemTR.appendChild(creationTimeTH);

//    // Create Last Modified Date/Time element and add it to the row
//    const lastModifiedTimeTH = document.createElement("th");
//      lastModifiedTimeTH.classList.add("filename-list-header-data");               // filename-list-header > filename-list-header-data
//      lastModifiedTimeTH.classList.add("filename-list-header-time-lastModified"); // filename-list-header > filename-list-header-time-lastModified
//      lastModifiedTimeTH.appendChild( document.createTextNode(this.listHeaderTextFileLastModifiedDateTime) );
//    fileNameItemTR.appendChild(lastModifiedTimeTH);

      // Create file size element and add it to the row
      const fileSizeTH = document.createElement("th");
        fileSizeTH.classList.add("filename-list-header-data");          // filename-list-header > filename-list-header-data
        fileSizeTH.classList.add("filename-list-header-filesize");      // filename-list-header > filename-list-header-filesize
        fileSizeTH.appendChild( document.createTextNode(this.listHeaderTextFileSize) );
      fileNameItemTR.appendChild(fileSizeTH);

    return fileNameItemTR;
  }  



  buildFileNameListItemUI(fileInfo) {
/*  FileInfo has these values:
    - fileName: the fileName
    - path: the full pathName
    - type: "regular", "directory", or "other"
    - size: for a Regular File, the size in bytes, otherwise -1
    - creationTime (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
    - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
    - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
    - permissions: expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)
*/ 

    this.debug(`-- BUILD LIST ITEM UI: -- fileInfo.path="${fileInfo.path}" fileName="${fileInfo.fileName}"`);

    const fileNameItemTR = document.createElement("tr");
      fileNameItemTR.classList.add("filename-list-item");             // filename-list-item
      fileNameItemTR.setAttribute("fileName", fileInfo.fileName);
      fileNameItemTR.addEventListener("click", (e) => this.backupFilenameClicked(e));

      // Create FileName element and add it to the row
      const fileNameTD = document.createElement("td");
        fileNameTD.classList.add("filename-list-item-data");          // filename-list-item > filename-list-item-data
        fileNameTD.classList.add("filename-list-item-filename");      // filename-list-item > filename-list-item-filename
        fileNameTD.appendChild(document.createTextNode(fileInfo.fileName));
      fileNameItemTR.appendChild(fileNameTD);

      // Create Creation Date/Time element and add it to the row
      const creationTimeTD = document.createElement("td");
        creationTimeTD.classList.add("filename-list-item-data");          // filename-list-item > filename-list-item-data
        creationTimeTD.classList.add("filename-list-item-time-creation"); // filename-list-item > filename-list-item-time-creation
        creationTimeTD.appendChild( document.createTextNode( formatMsToDateTime24HR(fileInfo.creationTime) ) );
      fileNameItemTR.appendChild(creationTimeTD);

      // Create file size element and add it to the row
      const fileSizeTD = document.createElement("td");
        fileSizeTD.classList.add("filename-list-item-data");          // filename-list-item > filename-list-item-data
        fileSizeTD.classList.add("filename-list-item-filesize");      // filename-list-item > filename-list-item-filesize
        fileSizeTD.appendChild( document.createTextNode(fileInfo.size) );
      fileNameItemTR.appendChild(fileSizeTD);

    return fileNameItemTR;
  }  



  async getBackupFileInfo() {
    let listBackupFileInfoResponse;
    try {
      listBackupFileInfoResponse = await this.fsbOptionsApi.listBackupFileInfo();
    } catch (error) {
      this.caught(error, "-- listBackupFileInfo");
    }

    if (! listBackupFileInfoResponse) {
      this.error("-- listBackupFileInfo -- NO RESPONSE");
    } else if (listBackupFileInfoResponse.invalid) {
      this.error(`-- listBackupFileInfo -- LIST FILEINFO ERROR: ${listBackupFileInfoResponse.invalid}`);
    } else if (listBackupFileInfoResponse.error) {
      this.error(`-- listBackupFileInfo -- LIST FILEINFO ERROR: ${listBackupFileInfoResponse.error}`);
    } else if (! listBackupFileInfoResponse.fileInfo) {
      this.error("-- listBackupFileInfo -- NO FILEINFO RETURNED");
    } else {
      return listBackupFileInfoResponse.fileInfo
    }
  }

  updateUIOnSelectionChanged() {
////const backupBtn  = document.getElementById("fsbBackupManagerBackupButton");
    const restoreBtn = document.getElementById("fsbBackupManagerRestoreButton");
    const deleteBtn  = document.getElementById("fsbBackupManagerDeleteButton");
////const doneBtn    = document.getElementById("fsbBackupManagerDoneButton");
    const selectedCount = this.getSelectedDomFileNameListItemCount();

    if (selectedCount == 0) {
      restoreBtn.disabled = true;
      deleteBtn.disabled  = true;
    } else if (selectedCount == 1) {
      restoreBtn.disabled = false;
      deleteBtn.disabled  = false;
    } else {
      restoreBtn.disabled = true;
      deleteBtn.disabled  = false;
    }
  }



  // and filename-list-item (TR or TD) was clicked
  async backupFilenameClicked(e) {
    if (! e) return;

////e.stopPropagation();
////e.stopImmediatePropagation();

    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    if (e.target.tagName == "TR" || e.target.tagName == "TD") {
      this.debug("-- TR or TD Clicked");

      let trElement = e.target;
      if (e.target.tagName == "TD") {
        trElement = e.target.closest('tr');
      }

      if (! trElement) {
        this.debug("-- Did NOT get our TR");

      } else {
        this.debug(  "-- Got our TR --"
                    + ` filename-list-item? ${trElement.classList.contains("filename-list-item")}`
                  );
        if (trElement.classList.contains("filename-list-item")) {
          const fileName = trElement.getAttribute("fileName");
          const wasSelected = trElement.classList.contains('selected');
      
          this.debug(`-- wasSelected=${wasSelected}  fileName="${fileName}"`);

          if (! wasSelected) {
            trElement.classList.add('selected');
          } else {
            trElement.classList.remove('selected');
          }

          this.updateUIOnSelectionChanged();
        }
      }
    }
  }

  deselectAllFileNames() {
    const domFileNameList = document.getElementById("fsbBackupManagerFileNameList");
    if (! domFileNameList) {
      this.debug("-- failed to get domFileNameList");
    } else {
      for (const listItem of domFileNameList.children) {
        listItem.classList.remove('selected');
      }

      this.updateUIOnSelectionChanged();
    }
  }



  // get only the FIRST!!!
  getSelectedDomFileNameListItem() {
    const domFileNameList = document.getElementById("fsbBackupManagerFileNameList");
    if (! domFileNameList) {
      this.debug("-- failed to get domFileNameList");
    } else {
      for (const domFileNameListItemTR of domFileNameList.children) {
        if (domFileNameListItemTR.classList.contains('selected')) {
          return domFileNameListItemTR;
        }
      }
    }
  }

  getSelectedDomFileNameListItems() {
    const domFileNameList = document.getElementById("fsbBackupManagerFileNameList");
    if (! domFileNameList) {
      this.debug("-- failed to get domFileNameList");
    } else {
      const selected = [];
      for (const domFileNameListItemTR of domFileNameList.children) {
        if (domFileNameListItemTR.classList.contains('selected')) {
          selected.push(domFileNameListItemTR);
        }
      }
      return selected;
    }
  }

  getSelectedDomFileNameListItemCount() {
    let   count           = 0;
    const domFileNameList = document.getElementById("fsbBackupManagerFileNameList");

    if (! domFileNameList) {
      this.debug("-- failed to get domFileNameList");
    } else {
      for (const domFileNameListItemTR of domFileNameList.children) {
        if (domFileNameListItemTR.classList.contains('selected')) {
          ++count;
        }
      }
    }

    return count;
  }



  async backupButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    const backupBtn = document.getElementById("fsbBackupManagerBackupButton");
    backupBtn.disabled = true;

    let   errors   = 0;
    const response = await this.fsbOptionsApi.backupToFile();
    if (! response) {
      this.error("-- FAILED TO RESTORE OPTIONS -- NO RESPONSE RETURNED");
      ++errors;
    } else if (response.invalid) {
      this.error("-- FAILED TO RESTORE OPTIONS -- INVALID RETURNED IN RESPONSE");
      ++errors;
    } else if (response.error) {
      this.error("-- FAILED TO RESTORE OPTIONS -- ERROR RETURNED IN RESPONSE");
      ++errors;
    } else if (! response.fileName) {
      this.error("-- FAILED TO RESTORE OPTIONS -- NO FILENAME RETURNED IN RESPONSE");
      ++errors;
    } else if ((typeof response.bytesWritten) !== 'number') {
      this.error(`-- FAILED TO RESTORE OPTIONS -- INVALID BYTES_WRITTEN RETURNED IN RESPONSE -- backupFileName="${response.fileName}"`);
      ++errors;
    } else if (response.bytesWritten < 1) {
      this.error(`-- FAILED TO RESTORE OPTIONS -- NO BYTES WRITTEN -- backupFileName="${response.fileName}"`);
      ++errors;
    } else {
      this.debug(`-- backupFileName="${response.fileName}" bytesWritten=${response.bytesWritten}`);
      await this.buildFileNameListUI();
    }

    if (errors) {
      // MABXXX ERROR MESSAGE
      this.setErrorFor("fsbBackupManagerTitlePanel", "fsbBackupManager_message_error_backupFailed"); /*I18N*/
    } else {
    }

    backupBtn.disabled = false;
  }



  async restoreButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    const restoreBtn = document.getElementById("fsbBackupManagerRestoreButton");
    restoreBtn.disabled = true;

    const domSelectedFileNameItemTR = this.getSelectedDomFileNameListItem();
    let errors = 0;

    if (! domSelectedFileNameItemTR) {
      this.error("-- NO FILENAME SELECTED -- Restore Button should have been disabled!!!");

    } else {
      this.debug(`-- domSelectedFileNameItemTR=${domSelectedFileNameItemTR} domSelectedFileNameItemTR.tagName="${domSelectedFileNameItemTR.tagName}"`);

      const backupFileName = domSelectedFileNameItemTR.getAttribute("fileName");
      this.debug(`-- Restoring Options from backupFileName="${backupFileName}"`);

      const response = await this.fsbOptionsApi.readOptionsFromBackupAndRestore(backupFileName);
      if (! response) {
        this.error(`-- FAILED TO RESTORE OPTIONS -- NO RESPONSE RETURNED -- backupFileName="${backupFileName}"`);
        ++errors;
      } else if (response.invalid) {
        this.error(`-- FAILED TO RESTORE OPTIONS -- INVALID RETURNED -- backupFileName="${backupFileName}"`);
        ++errors;
      } else if (response.error) {
        this.error(`-- FAILED TO RESTORE OPTIONS -- ERROR RETURNED -- backupFileName="${backupFileName}"`);
        ++errors;
      } else if (! response.fileName) {
        this.error(`-- FAILED TO RESTORE OPTIONS -- NO FILENAME RETURNED -- backupFileName="${backupFileName}"`);
        ++errors;
      } else if (! response.object) {
        this.error(`-- FAILED TO RESTORE OPTIONS -- NO DATA OBJECT RETURNED -- backupFileName="${backupFileName}"`);
        ++errors;
      } else {
        if (this.DEBUG) {
          const entries = Object.entries(response.object);
          this.debugAlways(`-- Options Restored -- response.fileName="${response.fileName}" response.object.entries.length="${entries.length}"`);
          for (const [key, value] of entries) {
            this.debugAlways(`-- OPTION ${key}: "${value}"`);
          }
        }
      }

      if (errors) {
        this.setErrorFor("fsbBackupManagerTitlePanel", "fsbBackupManager_message_error_restoreFailed");
      } else {
        const responseMessage = { 'RESTORED': backupFileName };

        this.debug(`-- Sending responseMessage="${responseMessage}"`);

        try {
          await messenger.runtime.sendMessage(
            { BackupManagerResponse: responseMessage }
          );
        } catch (error) {
          this.caught( error, 
                       "##### SEND RESPONSE MESSAGE FAILED #####"
                       + `\n- responseMessage="${responseMessage}"`
                     );
          ++errors;
          this.setErrorFor("fsbBackupManagerTitlePanel", "fsbBackupManager_message_error_responseMessageFailed");
        }
      }

      if (errors) {
        // allow the user to see the message
        restoreBtn.disabled = false;

      } else {
        this.debug("-- No Errors - closing window");
        window.close();
      }
    }
  }



  async deleteButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    const deleteBtn = document.getElementById("fsbBackupManagerDeleteButton");
    deleteBtn.disabled = true;

    const domSelectedFileNameItemTRs = this.getSelectedDomFileNameListItems();
    let errors = 0;

    if (! domSelectedFileNameItemTRs) {
      this.error("-- NO FILENAMES SELECTED -- Delete Button should have been disabled!!!");

    } else {
      this.debug(`-- domSelectedFileNameItemTRs.length=${domSelectedFileNameItemTRs.length}`);

      for (const domSelectedFileNameItemTR of domSelectedFileNameItemTRs) {
        const backupFileName = domSelectedFileNameItemTR.getAttribute("fileName");
        this.debug(`-- Deleting Options backupFileName="${backupFileName}"`);

        const response = await this.fsbOptionsApi.deleteBackupFile(backupFileName);
        if (! response) {
          this.error(`-- FAILED TO DELETE OPTIONS BACKUP FILE -- NO RESPONSE RETURNED -- backupFileName="${backupFileName}"`);
          ++errors;
        } else if (response.invalid) {
          this.error(`-- FAILED TO DELETE OPTIONS BACKUP FILE -- INVALID RETURNED -- backupFileName="${backupFileName}"`);
          ++errors;
        } else if (response.error) {
          this.error(`-- FAILED TO DELETE OPTIONS BACKUP FILE -- ERROR RETURNED -- backupFileName="${backupFileName}"`);
          ++errors;
        } else if (! response.fileName) {
          this.error(`-- FAILED TO DELETE OPTIONS BACKUP FILE -- NO FILENAME RETURNED -- backupFileName="${backupFileName}"`);
          ++errors;
        } else if (! response.deleted) {
          this.error(`-- FAILED TO DELETE OPTIONS BACKUP FILE -- backupFileName="${backupFileName}" response.deleted="${response.deleted}"`);
          ++errors;
        } else {
          this.debug(`-- Options Backup File Deleted -- backupFileName="${backupFileName}" response.deleted="${response.deleted}"`);
          domSelectedFileNameItemTR.remove();
        }
      }

      if (errors) {
        this.setErrorFor("fsbBackupManagerTitlePanel", "fsbBackupManager_message_error_deleteFailed"); /* I18N */
      } else {
        // MABXXX NO RESPONSE MESSAGE REQUIRED FOR BACKUP FILE DELETE
//      const responseMessage = { 'RESTORED': backupFileName };
//
//      this.debug(`-- Sending responseMessage="${responseMessage}"`);
//
//      try {
//        await messenger.runtime.sendMessage(
//          { BackupManagerResponse: responseMessage }
//        );
//      } catch (error) {
//        this.caught( error, 
//                     "##### SEND RESPONSE MESSAGE FAILED #####"
//                     + `\n- responseMessage="${responseMessage}"`
//                   );
//        ++errors;
//        this.setErrorFor("fsbBackupManagerTitlePanel", "fsbBackupManager_message_error_responseMessageFailed"); /* I18N */
//      }
      }
    }

    if (errors) {
      // MABXXX ERROR MESSAGE
    } else {
    }

    this.updateUIOnSelectionChanged();

    deleteBtn.disabled = false;
  }



  resetErrors() {
    let errorDivs = document.querySelectorAll("div.backup-error");
    if (errorDivs) {
      for (let errorDiv of errorDivs) {
        errorDiv.setAttribute("error", "false");
      }
    }

    let errorLabels = document.querySelectorAll("label.backup-error-text");
    if (errorLabels) {
      for (let errorLabel of errorLabels) {
        errorLabel.setAttribute("error", "false");
        errorLabel.innerText = ""; // MABXXX THIS IS A HUGE LESSON:  DO NOT USE: <label/>   USE: <label></label> 
      }
    }
  }

  setErrorFor(elementId, msgId) {
    if (elementId && msgId) {
      let errorDiv = document.querySelector("div.backup-error[error-for='" + elementId + "']");
      if (errorDiv) {
        errorDiv.setAttribute("error", "true");
      }

      let errorLabel = document.querySelector("label.backup-error-text[error-for='" + elementId + "']");
      if (errorLabel) {
        let i18nMessage = getI18nMsg(msgId);
        errorLabel.innerText = i18nMessage;
      }
    }
  }



  async doneButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    this.canceled = true;

    let responseMessage = "DONE";
    this.debug(`-- Sending responseMessage="${responseMessage}"`);

    try {
      await messenger.runtime.sendMessage(
        { BackupManagerResponse: responseMessage }
      );
    } catch (error) {
      // any need to tell the user???
      this.caught( error,
                   "##### SEND RESPONSE MESSAGE FAILED #####"
                   + `\n- responseMessage="${responseMessage}"`
                 );
    }

    this.debug("-- Closing window");
    window.close();
  }
}



const backupManager = new BackupManager();

document.addEventListener("DOMContentLoaded", (e) => backupManager.run(e), {once: true});
