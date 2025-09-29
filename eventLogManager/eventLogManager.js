import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { FsbOptions          } from '../modules/options.js';
import { Logger              } from '../modules/logger.js';
import { FsbEventLogger      } from '../modules/event_logger.js';
import { getI18nMsg, formatMsToDateTime24HR, formatMsToDateTime12HR, formatMsToTimeForFilename } from '../utilities.js';




class EventLogManager {
  constructor() {
    this.CLASS_NAME                  = this.constructor.name;

    this.LOG_FILENAME_EXTENSION      = ".log";
    this.LOG_FILENAME_MATCH_GLOB     = "*.log";
    this.ARCHIVE_FILENAME_EXTENSION  = ".alog";
    this.ARCHIVE_FILENAME_MATCH_GLOB = "*.alog";

    this.LOG                         = false;
    this.DEBUG                       = false;

    this.logger                      = new Logger();
    this.fsbOptionsApi               = new FsbOptions(this.logger);
    this.fsBrokerApi                 = new FileSystemBrokerAPI();
    this.fsbEventLogger              = new FsbEventLogger(this.fsbOptionsApi, this.logger);

    this.LIST_MODE_LOGS              = 'logs';
    this.LIST_MODE_ARCHIVES          = 'archives';
    this.listMode                    = this.LIST_MODE_LOGS;
    this.canceled                    = false;

    this.fileListItemClickTimeout   = null;  // for detecting single- vs double-click
    this.FILE_LIST_ITEM_CLICK_DELAY = 500;   // 500ms, 1/2 second (the JavaScript runtime does not guarantee this time - it's single-threaded)


    this.i18n_listHeader_FileName                   = getI18nMsg( "fsbEventLogManager_listHeader_fileName",                           "File Name"                             );
    this.i18n_listHeader_FileCreationDateTime       = getI18nMsg( "fsbEventLogManager_listHeader_fileTimeCreated",                    "Time Created"                          );
    this.i18n_listHeader_FileLastModifiedDateTime   = getI18nMsg( "fsbEventLogManager_listHeader_fileTimeLastModified",               "Time Last Modified"                    );
    this.i18n_listHeader_FileSize                   = getI18nMsg( "fsbEventLogManager_listHeader_fileSize",                           "Size (bytes)"                          );

    this.i18n_title_listMode_logs                   = getI18nMsg( "fsbEventLogManager_title_listMode_logs.label",                     "Log Files"                             );
    this.i18n_title_listMode_archives               = getI18nMsg( "fsbEventLogManager_title_listMode_archives.label",                 "Archived Log Files"                    );
    this.i18n_button_listMode_logs                  = getI18nMsg( "fsbEventLogManager_button_listMode_logs.label",                    "List Log Files"                        );
    this.i18n_button_listMode_archives              = getI18nMsg( "fsbEventLogManager_button_listMode_archives.label",                "List Archived Log Files"               );
    this.i18n_label_deleteNumDays_listMode_logs     = getI18nMsg( "fsbEventLogManager_label_deleteNumDays_listMode_logs.label",       "Delete Event Logs older than"          );
    this.i18n_label_deleteNumDays_listMode_archives = getI18nMsg( "fsbEventLogManager_label_deleteNumDays_listMode_archives.label",   "Delete Archived Event Logs older than" );
  }

  log(...info) {
    if (! this.LOG) return;
    const msg = info.shift();
    this.logger.log(this.CLASS_NAME + '#' + msg, ...info);
  }

  logAlways(...info) {
    const msg = info.shift();
    this.logger.logAlways(this.CLASS_NAME + '#' + msg, ...info);
  }

  debug(...info) {
    if (! this.DEBUG) return;
    const msg = info.shift();
    this.logger.debug(this.CLASS_NAME + '#' + msg, ...info);
  }

  debugAlways(...info) {
    const msg = info.shift();
    this.logger.debugAlways(this.CLASS_NAME + '#' + msg, ...info);
  }

  error(...info) {
    // always log errors
    const msg = info.shift();
    this.logger.error(this.CLASS_NAME + '#' + msg, ...info);
  }

  caught(e, ...info) {
    // always log exceptions
    const msg = info.shift();
    this.logger.error( this.CLASS_NAME + '#' + msg,
                       "\n- name:    " + e.name,
                       "\n- message: " + e.message,
                       "\n- stack:   " + e.stack,
                       ...info
                     );
  }



  async run(e) {
    this.debug("run -- begin");

    ////window.onbeforeunload = (e) => this.windowUnloading(e);
    window.addEventListener("beforeunload", (e) => this.windowUnloading(e));

    const showInstructions = await this.fsbOptionsApi.isEnabledShowEventLogManagerInstructions();
    this.showHideInstructions(showInstructions);

    await this.updateOptionsUI();
    await this.updateEventLogsDirectoryUI();
    await this.localizePage();
          this.populateDeleteOldLogsDaysSelect();
    await this.buildFileNameListUI();
    this.setupEventListeners();
  }



  populateDeleteOldLogsDaysSelect() {
    const numDaysSelect = document.getElementById("fsbEventLogManagerActionDeleteEventLogsOlderThanDaysSelect");
    if (numDaysSelect) {
      numDaysSelect.innerHTML = '';

      for (var i=1; i<=21; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = getI18nMsg("numDaysSelectOption_" + i);
        numDaysSelect.appendChild(option)
      }

      numDaysSelect.value = 7;
    }
  }



  setupEventListeners() {
    document.addEventListener( "change", (e) => this.optionChanged(e) );   // One of the checkboxes or radio buttons was clicked or a select has changed
    document.addEventListener( "click",  (e) => this.actionClicked(e) );   // An Actions button was clicked (or a label, since <label for="xx"> does not work)

    const listModeBtn = document.getElementById("fsbEventLogManagerListModeButton");
    listModeBtn.addEventListener("click", (e) => this.listModeButtonClicked(e));

    const viewBtn = document.getElementById("fsbEventLogManagerViewButton");
    viewBtn.addEventListener("click", (e) => this.viewButtonClicked(e));

    const archiveBtn = document.getElementById("fsbEventLogManagerArchiveButton");
    archiveBtn.addEventListener("click", (e) => this.archiveButtonClicked(e));

    const deleteBtn = document.getElementById("fsbEventLogManagerDeleteButton");
    deleteBtn.addEventListener("click", (e) => this.deleteButtonClicked(e));

    const doneBtn = document.getElementById("fsbEventLogManagerDoneButton");
    doneBtn.addEventListener("click", (e) => this.doneButtonClicked(e));
  }



  async localizePage() {
    this.debug("localizePage -- start");

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

    this.debug("localizePage -- end");
  }



  async updateOptionsUI() {
    this.debug("updateOptionsUI -- start");

    const options = await this.fsbOptionsApi.getAllOptions();

    this.debug("updateOptionsUI -- sync options to UI");
    for (const [optionName, optionValue] of Object.entries(options)) {
      this.debug("updateOptionsUI -- option: ", optionName, "value: ", optionValue);

      if (optionName in this.fsbOptionsApi.defaultOptionValues) {
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

    this.debug("updateOptionsUI -- end");
  }



  // One of the Options checkboxes or radio buttons (etc) has been clicked or a select has changed
  //
  // copied from optionsUI.js, so this does a lot that we don't really need for now.
  async optionChanged(e) {
    if (e == null) return;
    this.debug(`optionChanged -- tagName="${e.target.tagName}" type="${e.target.type}" fsbGeneralOption? ${e.target.classList.contains("fsbGeneralOption")} id="${e.target.id}"`);

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
        this.debug(`optionChanged -- radio buttton selected ${optionName}=<${optionValue}> - group=${target.name}`);

        // first, set this option
        this.debug(`optionChanged -- Setting Radio Option {[${optionName}]: ${optionValue}}`);
        await this.fsbOptionsApi.storeOption(
          { [optionName]: optionValue }
        );

        // get all the elements with the same name, and if they're a radio, un-check them
        if (target.name) { /* && (optionValue == true || optionValue == 'true')) { Don't need this. Event fired *ONLY* when SELECTED, i.e. true */
          const radioGroupName = target.name;
          const radioGroup = document.querySelectorAll(`input[type="radio"][name="${radioGroupName}"]`);
          if (! radioGroup) {
            this.debug('optionChanged -- no radio group found');
          } else {
            this.debug(`optionChanged -- radio group members length=${radioGroup.length}`);
            if (radioGroup.length < 2) {
              this.debug('optionChanged -- no radio group members to reset (length < 2)');
            } else {
              for (const radio of radioGroup) {
                if (radio.id != optionName) { // don't un-check the one that fired
                  this.debug(`optionChanged -- resetting radio button {[${radio.id}]: false}`);
                  await this.fsbOptionsApi.storeOption(
                    { [radio.id]: false }
                  );
                }
              }
            }
          }
        }
      } else { // since we already tested for it, it's got to be a checkbox
        this.debug(`optionChanged -- Setting Checkbox Option {[${optionName}]: ${optionValue}}`);
        await this.fsbOptionsApi.storeOption(
          { [optionName]: optionValue }
        );

        // special processing for these checkboxes
        switch (optionName) {
          case "fsbShowEventLogManagerInstructions": 
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

      this.debug(`optionChanged -- Setting Select Option {[${optionName}]: ${optionValue}}`);
      await this.fsbOptionsApi.storeOption(
        { [optionName]: optionValue }
      );
    }
  }



  // An Action button was clicked
  // or a label was clicked, so check it has a for="" attribute,
  // or ...
  //
  // Copied from optionsUI.js, so this does a lot that we don't really need for now.
  async actionClicked(e) {
    this.debug('actionClicked --');
    if (e == null) return;

    this.debug(`actionClicked -- tagName="${e.target.tagName}" id="${e.target.id}" for="${e.target.getAttribute('for')}"`);

    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'LABEL') {
      this.debug(`actionClicked -- BUTTON OR LABEL CLICKED tagName="${e.target.tagName}" id="${e.target.id}"`);

      if (e.target.tagName === 'LABEL' && e.target.parentElement.tagName !== 'BUTTON') {
      } else {
        e.preventDefault();

        var button;
        if (e.target.tagName === 'LABEL') {
          button = e.target.parentElement;
        } else {
          button = e.target;
        }
        this.debug(`actionClicked -- BUTTON CLICKED tagName="${button.tagName}" id="${button.id}"`);

        const buttonId = button.id;
        if (buttonId) switch (buttonId) {
          case "fsbEventLogManagerActionDeleteEventLogsOlderThanDaysButton":
            this.deleteEventLogsOlderThanDaysButtonClicked(e);
            break;
          default:
            this.debug(`action -- NOT OUR BUTTON -- tagName="${e.target.tagName}" id="${e.target.id}"`);
        }
      }
    } else if (e.target.tagName == "DIV") {
      this.debug(`action -- DIV CLICKED id="${e.target.id}"`);

      const divId = e.target.id;
      if (divId == "XXX") {
      }
    } else {
      // otherwise we don't care about this click
    }
  }



  async deleteEventLogsOlderThanDaysButtonClicked(e) {
    const numDaysSelect = document.getElementById("fsbEventLogManagerActionDeleteEventLogsOlderThanDaysSelect");
    if (numDaysSelect) {
      const numDays = +numDaysSelect.value;
      const archives = (this.listMode === this.LIST_MODE_ARCHIVES);
      this.debugAlways(`deleteEventLogsOlderThanDaysButtonClicked -- numDays=${numDays} archives=${archives}`);
      const deletedFileNames = await this.fsbEventLogger.deleteOldEventLogs(numDays, archives);
      this.debugAlways(`deleteEventLogsOlderThanDaysButtonClicked -- deletedFileNames.length=${deletedFileNames.length}`);

      if (deletedFileNames && deletedFileNames.length > 0) {
        // could delete the rows for the given fileNames, but just rebuild the list for now...
        await this.buildFileNameListUI();
      }
    }
  }



  async updateEventLogsDirectoryUI() {
    const eventLogsDirectoryPathNameLabel = document.getElementById("fsbEventLogsDirectoryPathName");
    const response                        = await this.fsBrokerApi.getFullPathName(); // MABXXX perhaps this should come from fsbOptionsApi???

    if (response && response.fullPathName) {
      eventLogsDirectoryPathNameLabel.textContent = response.fullPathName;
    } else {
      eventLogsDirectoryPathNameLabel.textContent = "???";
    }
  }



  async windowUnloading(e) {
    if (this.DEBUG) this.debugAlways( "windowUnloading --- Window Unloading ---"
                                      + `\n- window.screenTop=${window.screenTop}`
                                      + `\n- window.screenLeft=${window.screenLeft}`
                                      + `\n- window.outerWidth=${window.outerWidth}`
                                      + `\n- window.outerHeight=${window.outerHeight}`
                                      + `\n- this.canceled=${this.canceled}`
                                    );
    await this.fsbOptionsApi.storeWindowBounds("eventLogManagerWindowBounds", window);

    if (this.DEBUG) {
      let bounds = await this.fsbOptionsApi.getWindowBounds("eventLogManagerWindowBounds");

      if (! bounds) {
        this.debugAlways("windowUnloading --- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- FAILED TO GET Log Manager Window Bounds ---");
      } else if (typeof bounds !== 'object') {
        this.error(`windowUnloading --- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- Log Manager Window Bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
      } else {
        this.debugAlways( "windowUnloading --- Retrieve Stored Window Bounds ---"
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
    const domFileNameList = document.getElementById("fsbEventLogManagerFileNameList");
    if (! domFileNameList) {
      this.error("run -- failed to get domFileNameList");
      // MABXXX DISPLAY MESSAGE TO USER
      return;
    }

    domFileNameList.innerHTML = '';
    this.updateUIOnSelectionChanged();

    const i18nMessage = getI18nMsg("fsbEventLogManager_message_fileNamesLoading", "...");
    const loadingTR = document.createElement("tr");
    loadingTR.classList.add("identities-loading");
    loadingTR.appendChild( document.createTextNode(i18nMessage) );
    domFileNameList.appendChild(loadingTR);

    const archiveButtonInstructions = document.getElementById("fsbEventLogManagerInstructions_archive");
    const archiveButton             = document.getElementById("fsbEventLogManagerArchiveButton");
    const fileNameListTitle         = document.getElementById("fsbEventLogManagerFileNameListTitle");
    if (this.listMode === this.LIST_MODE_LOGS) {
      archiveButtonInstructions.style.display = 'list-item';
      archiveButton.style.display             = 'inline-block';
      fileNameListTitle.textContent           = this.i18n_title_listMode_logs;
    } else { // if (this.listMode === this.LIST_MODE_ARCHIVES) {
      archiveButtonInstructions.style.display = 'none';
      archiveButton.style.display             = 'none';
      fileNameListTitle.textContent           = this.i18n_title_listMode_archives;
    }

    const eventLogInfo = await this.getEventLogInfo();

    domFileNameList.innerHTML = '';

    if (! eventLogInfo) {
      this.appendListMessageUI(domFileNameList, getI18nMsg(   'fsbEventLogManager_message_noFileInfo',     "Unable to get FileName List" ) );
    } else if (eventLogInfo.length < 1) {
      if (this.listMode === this.LIST_MODE_LOGS) {
        this.appendListMessageUI(domFileNameList, getI18nMsg( 'fsbEventLogManager_message_noEventLogs',    "No Log Files"                ) );
      } else {
        this.appendListMessageUI(domFileNameList, getI18nMsg( 'fsbEventLogManager_message_noArchiveFiles', "No Archived Log Files"       ) );
      }
    } else {
      const headerItemUI = this.buildFileNameListHeaderUI();
      domFileNameList.append(headerItemUI);

      for (const fileInfo of eventLogInfo) {
        const listItemUI = this.buildFileNameListItemUI(fileInfo);
        domFileNameList.append(listItemUI);
      }
    }
  }



  appendListMessageUI(domList, msg) {
    const listMessageTR = document.createElement('tr');
      const listMessageTD = document.createElement('td');
        listMessageTD.style.setProperty('white-space', 'nowrap');
        listMessageTD.appendChild( document.createTextNode(msg) );
      listMessageTR.appendChild(listMessageTD);
    domList.appendChild(listMessageTR);
  }



  buildFileNameListHeaderUI() {
    this.debug("buildFileNameListHeaderUI -- BUILD LIST HEADER UI");

    const fileNameItemTR = document.createElement("tr");
      fileNameItemTR.classList.add("filename-list-header");             // filename-list-header

      // Create FileName element and add it to the row
      const fileNameTH = document.createElement("th");
        fileNameTH.classList.add("filename-list-header-data");          // filename-list-header > filename-list-header-data
        fileNameTH.classList.add("filename-list-header-filename");      // filename-list-header > filename-list-header-filename
        fileNameTH.appendChild( document.createTextNode(this.i18n_listHeader_FileName) );
      fileNameItemTR.appendChild(fileNameTH);

      // Create Creation Date/Time element and add it to the row
      const creationTimeTH = document.createElement("th");
        creationTimeTH.classList.add("filename-list-header-data");         // filename-list-header > filename-list-header-data
        creationTimeTH.classList.add("filename-list-header-time-created"); // filename-list-header > filename-list-header-time-created
        creationTimeTH.appendChild( document.createTextNode(this.i18n_listHeader_FileCreationDateTime) );
      fileNameItemTR.appendChild(creationTimeTH);

      // Create Last Modified Date/Time element and add it to the row
      const lastModifiedTimeTH = document.createElement("th");
        lastModifiedTimeTH.classList.add("filename-list-header-data");               // filename-list-header > filename-list-header-data
        lastModifiedTimeTH.classList.add("filename-list-header-time-last-modified"); // filename-list-header > filename-list-header-time-last-modified
        lastModifiedTimeTH.appendChild( document.createTextNode(this.i18n_listHeader_FileLastModifiedDateTime) );
      fileNameItemTR.appendChild(lastModifiedTimeTH);

      // Create file size element and add it to the row
      const fileSizeTH = document.createElement("th");
        fileSizeTH.classList.add("filename-list-header-data");          // filename-list-header > filename-list-header-data
        fileSizeTH.classList.add("filename-list-header-filesize");      // filename-list-header > filename-list-header-filesize
        fileSizeTH.appendChild( document.createTextNode(this.i18n_listHeader_FileSize) );
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

    this.debug(`buildFileNameListItemUI -- BUILD LIST ITEM UI: -- fileInfo.path="${fileInfo.path}" fileName="${fileInfo.fileName}"`);

    const fileNameItemTR = document.createElement("tr");
      fileNameItemTR.classList.add("filename-list-item");             // filename-list-item
      fileNameItemTR.setAttribute("fileName", fileInfo.fileName);
      fileNameItemTR.addEventListener( "click",    (e) => this.eventLogItemClicked(e)       );
      fileNameItemTR.addEventListener( "dblclick", (e) => this.eventLogItemDoubleClicked(e) );

      // Create FileName element and add it to the row
      const fileNameTD = document.createElement("td");
        fileNameTD.classList.add("filename-list-item-data");          // filename-list-item > filename-list-item-data
        fileNameTD.classList.add("filename-list-item-filename");      // filename-list-item > filename-list-item-filename
        fileNameTD.appendChild( document.createTextNode(fileInfo.fileName) );
      fileNameItemTR.appendChild(fileNameTD);

      // Create Creation Date/Time element and add it to the row
      const creationTimeTD = document.createElement("td");
        creationTimeTD.classList.add("filename-list-item-data");               // filename-list-item > filename-list-item-data
        creationTimeTD.classList.add("filename-list-item-time-last-modified"); // filename-list-item > filename-list-item-time-last-modified
        creationTimeTD.appendChild( document.createTextNode( formatMsToDateTime24HR(fileInfo.creationTime) ) );
      fileNameItemTR.appendChild(creationTimeTD);

      // Create Last Modified Date/Time element and add it to the row
      const lastModifiedTimeTD = document.createElement("td");
        lastModifiedTimeTD.classList.add("filename-list-item-data");               // filename-list-item > filename-list-item-data
        lastModifiedTimeTD.classList.add("filename-list-item-time-lastModified"); // filename-list-item > filename-list-item-time-lastModified
        lastModifiedTimeTD.appendChild( document.createTextNode( formatMsToDateTime24HR(fileInfo.lastModified) ) );
      fileNameItemTR.appendChild(lastModifiedTimeTD);

      // Create file size element and add it to the row
      const fileSizeTD = document.createElement("td");
        fileSizeTD.classList.add("filename-list-item-data");          // filename-list-item > filename-list-item-data
        fileSizeTD.classList.add("filename-list-item-filesize");      // filename-list-item > filename-list-item-filesize
        fileSizeTD.appendChild( document.createTextNode(fileInfo.size) );
      fileNameItemTR.appendChild(fileSizeTD);

    return fileNameItemTR;
  }  



  showHideInstructions(show) {
    this.debug(`showHideInstructions -- show=${show}`);
    const panel = document.getElementById("fsbEventLogManagerInstructions");
    if (panel) {
      if (show) {
        panel.style.setProperty('display', 'block');
      } else {
        panel.style.setProperty('display', 'none');
      }
    }
  }



  async getEventLogInfo() { // MABXXX SHOULD USE FsbEventLogger.getEventLogInfo()
    let listEventLogInfoResponse;
    try {
      listEventLogInfoResponse = await this.listEventLogInfo(); // MABXXX FsbEventLogger HAS listEventLogInfo() AS WELL
    } catch (error) {
      this.caught(error, " -- listEventLogs");
    }

    if (! listEventLogInfoResponse) {
      this.error("getEventLogInfo -- listEventLogInfo -- NO RESPONSE");
    } else if (listEventLogInfoResponse.invalid) {
      this.error(`getEventLogInfo -- listEventLogInfo -- LIST FILEINFO ERROR: ${listEventLogInfoResponse.invalid}`);
    } else if (listEventLogInfoResponse.error) {
      this.error(`getEventLogInfo -- listEventLogInfo -- LIST FILEINFO ERROR: ${listEventLogInfoResponse.error}`);
    } else if (! listEventLogInfoResponse.fileInfo) {
      this.error("getEventLogInfo -- listEventLogInfo -- NO FILEINFO RETURNED");
    } else {
      return listEventLogInfoResponse.fileInfo
    }
  }



  updateUIAfterDelete() {
    const domFileNameList = document.getElementById("fsbEventLogManagerFileNameList");
    if (! domFileNameList) {
      this.error("updateUIAfterDelete -- failed to get domFileNameList");
      return;
    }

    const selector            = "tr.filename-list-item";
    const fileNameListItemTRs = domFileNameList.querySelectorAll(selector);

    // PROBABLY NOT A GOOD IDEA - DELETE PROBABLY CREATED A NEW LOG FILE, SO NEED TO REBUILD LIST INSTEAD
    if (fileNameListItemTRs.length == 0) {
      domFileNameList.innerHTML = '';
      this.appendListMessageUI(domFileNameList, getI18nMsg('fsbEventLogManager_message_noEventLogs', "No Log Files") );
    }
  }



  updateUIOnSelectionChanged() {
    const viewBtn       = document.getElementById("fsbEventLogManagerViewButton");
    const archiveBtn    = document.getElementById("fsbEventLogManagerArchiveButton");
    const deleteBtn     = document.getElementById("fsbEventLogManagerDeleteButton");
////const doneBtn       = document.getElementById("fsbEventLogManagerDoneButton");
    const selectedCount = this.getSelectedDomFileNameListItemCount();

    if (selectedCount == 0) {
      viewBtn.disabled    = true;
      archiveBtn.disabled = true;
      deleteBtn.disabled  = true;
    } else if (selectedCount == 1) {
      viewBtn.disabled    = false;
      archiveBtn.disabled = false;
      deleteBtn.disabled  = false;
    } else {
      viewBtn.disabled    = true;
      archiveBtn.disabled = false;
      deleteBtn.disabled  = false;
    }
  }



  // a filename-list-item (TR or TD) was clicked
  async eventLogItemClicked(e) {
    if (! e) return;

    e.stopPropagation();
    e.stopImmediatePropagation();

    this.debug(`eventLogItemClicked -- e.target.tagName="${e.target.tagName}"`);

    if (e.target.tagName == 'TR' || e.target.tagName == 'TD') {
      this.debug("eventLogItemClicked -- TR or TD Clicked");

      // there's a reason for not simply using closest('tr') but I just don't remember
      let trElement;
      if (e.target.tagName == 'TR') {
        trElement = e.target;
      } else if (e.target.tagName == 'TD' && e.target.parentElement && e.target.parentElement.tagName == 'TR') {
        trElement = e.target.parentElement;
      }

      if (! trElement) {
        this.debug("eventLogItemClicked -- Did NOT get our TR");
      } else if (! trElement.classList.contains("filename-list-item")) {
        this.debug("eventLogItemClicked -- TR does NOT have class 'filename-list-item'");
      } else {
        const fileName = trElement.getAttribute("fileName");
        this.debugAlways(`eventLogItemClicked -- Got TR.filename-list-item fileName=${fileName} FILE_LIST_ITEM_CLICK_DELAY=${this.FILE_LIST_ITEM_CLICK_DELAY}`);
        this.fileListItemClickTimeout = setTimeout( () => this.eventLogItemSingleClicked( e, trElement, Date.now() ), this.FILE_LIST_ITEM_CLICK_DELAY );
      }
    }
  }

  async eventLogItemSingleClicked(e, trElement, timerSetMS) {
    const timeout = this.fileListItemClickTimeout;
    this.fileListItemClickTimeout = null;
    if (timeout) {
      clearTimeout(timeout);

      const fileName    = trElement.getAttribute("fileName");
      const wasSelected = trElement.classList.contains('selected');

      this.debug(`eventLogItemSingleClicked -- GOT SINGLE-CLICK ON TR: wasSelected=${wasSelected} fileName="${fileName}"`);

      if (! wasSelected) {
        trElement.classList.add('selected');
      } else {
        trElement.classList.remove('selected');
      }

      this.updateUIOnSelectionChanged();
    }
  }

  async eventLogItemDoubleClicked(e) {
    const timeout = this.fileListItemClickTimeout;
    this.fileListItemClickTimeout = null;
    if (timeout) {
      clearTimeout(timeout); // why is clearTimeout() not working???
      this.debug("eventLogItemDoubleClicked -- GOT DOUBLE-CLICK -- cleared Timeout", timeout);
    }

    if (! e) return;

    this.debug(`eventLogItemDoubleClicked -- GOT DOUBLE-CLICK -- e.target.tagName="${e.target.tagName}" e.detail=${e.detail}`);

    if (e.detail == 2 && (e.target.tagName == 'TR' || e.target.tagName == 'TD')) {
      this.debug("eventLogItemDoubleClicked -- TR or TD Double-Clicked");

      // there's a reason for not simply using closest('tr') but I just don't remember
      let trElement;
      if (e.target.tagName == 'TR') {
        trElement = e.target;
      } else if (e.target.tagName == 'TD' && e.target.parentElement && e.target.parentElement.tagName == 'TR') {
        trElement = e.target.parentElement;
      }

      if (! trElement) {
        this.error("eventLogItemDoubleClicked -- NO TR ELEMENT");
      } else {
        this.debug("eventLogItemDoubleClicked -- GOT TR ELEMENT");
        if (! trElement.classList.contains("filename-list-item")) {
          this.error("eventLogItemDoubleClicked -- TR ELEMENT DOES NOT HAVE CLASS 'filename-list-item'");
        } else {
          const fileName = trElement.getAttribute("fileName");
          this.debug(`eventLogItemDoubleClicked -- GOT DOUBLE-CLICK ON TR: fileName="${fileName}"`);
          if (! fileName) {
            this.error("eventLogItemDoubleClicked -- TR ELEMENT DOES NOT HAVE ATTRIBUTE 'fileName'");
          } else {
            await this.showEventLogViewer(fileName);
          }
        }
      }
    }
  }



  deselectAllFileNames() {
    const domFileNameList = document.getElementById("fsbEventLogManagerFileNameList");
    if (! domFileNameList) {
      this.error("deselectAllFileNames -- failed to get domFileNameList");
    } else {
      for (const listItem of domFileNameList.children) {
        listItem.classList.remove('selected');
      }

      this.updateUIOnSelectionChanged();
    }
  }



  // get only the FIRST!!!
  getSelectedDomFileNameListItem() {
    const domFileNameList = document.getElementById("fsbEventLogManagerFileNameList");
    if (! domFileNameList) {
      this.error("getSelectedDomFileNameListItem -- failed to get domFileNameList");
    } else {
      for (const domFileNameListItemTR of domFileNameList.children) {
        if (domFileNameListItemTR.classList.contains('selected')) {
          return domFileNameListItemTR;
        }
      }
    }
  }

  getSelectedDomFileNameListItems() {
    const domFileNameList = document.getElementById("fsbEventLogManagerFileNameList");
    if (! domFileNameList) {
      this.error("getSelectedDomFileNameListItems -- failed to get domFileNameList");
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
    const domFileNameList = document.getElementById("fsbEventLogManagerFileNameList");

    if (! domFileNameList) {
      this.error("getSelectedDomFileNameListItemCount -- failed to get domFileNameList");
    } else {
      for (const domFileNameListItemTR of domFileNameList.children) {
        if (domFileNameListItemTR.classList.contains('selected')) {
          ++count;
        }
      }
    }

    return count;
  }



  async listModeButtonClicked(e) {
    this.debug(`listModeButtonClicked -- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    const listModeButtonLabel      = document.getElementById("fsbEventLogManagerListModeButtonLabel");
    const deleteNumDaysSelectLabel = document.getElementById("fsbEventLogManagerActionDeleteEventLogsOlderThanDaysSelectLabel");

    if (this.listMode === this.LIST_MODE_LOGS) {
      this.listMode = this.LIST_MODE_ARCHIVES;
      listModeButtonLabel.textContent      = this.i18n_button_listMode_logs;
      deleteNumDaysSelectLabel.textContent = this.i18n_label_deleteNumDays_listMode_archives;
    } else {
      this.listMode = this.LIST_MODE_LOGS;
      listModeButtonLabel.textContent      = this.i18n_button_listMode_archives;
      deleteNumDaysSelectLabel.textContent = this.i18n_label_deleteNumDays_listMode_logs;
    }

    await this.buildFileNameListUI();
  }



  async viewButtonClicked(e) {
    this.debug(`viewButtonClicked -- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    await this.viewSelectedEventLog(e);
  }

  async viewSelectedEventLog(e) {
    const domSelectedFileNameListItemTR = this.getSelectedDomFileNameListItem();
    if (! domSelectedFileNameListItemTR) {
      this.error("viewSelectedEventLog -- No fileName Item Selected");
      return;
    }

    const selectedFileName = domSelectedFileNameListItemTR.getAttribute('fileName');
    if (! selectedFileName) {
      this.error("viewSelectedEventLog -- Selected fileName Item has no 'fileName' attribute");
      return;
    }

    const viewBtn = document.getElementById("fsbEventLogManagerViewButton");
    viewBtn.disabled = true;

    await this.showEventLogViewer(selectedFileName);

    this.updateUIOnSelectionChanged(); // need to make sure viewBtn.disabled = true is correctly reversed
  }



  async showEventLogViewer(fileName) { // MABXXX could we make all this part of the LogViewer class inside eventLogViewer.js ???
    this.debug(`showEventLogViewer -- fileName="${fileName}"`);

    let   popupLeft   = 100;
    let   popupTop    = 100;
    let   popupHeight = 900;
    let   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("showEventLogViewer -- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "showEventLogViewer -- Got the Current (Main, mail:3pane) Window:"
                  + `\n- mainWindow.top=${mainWindow.top}`
                  + `\n- mainWindow.left=${mainWindow.left}`
                  + `\n- mainWindow.height=${mainWindow.height}`
                  + `\n- mainWindow.width=${mainWindow.width}`
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    let bounds = await this.fsbOptionsApi.getWindowBounds("eventLogViewerWindowBounds");

    if (! bounds) {
      this.debug("showEventLogViewer -- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`showEventLogViewer -- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "showEventLogViewer -- restoring previous window bounds:"
                  + `\n- bounds.top=${bounds.top}`
                  + `\n- bounds.left=${bounds.left}`
                  + `\n- bounds.width=${bounds.width}`
                  + `\n- bounds.height=${bounds.height}`
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }



    // window.id does not exist.  how do we get our own window id???
    let   ourTabId;
    let   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.error("showEventLogViewer -- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`showEventLogViewer -- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }



    const eventLogViewerUrl = messenger.runtime.getURL("../eventLogManager/eventLogViewer.html")
                             + `?mode=${encodeURIComponent(this.listMode)}`
                             + `&fileName=${encodeURIComponent(fileName)}`;

    let eventLogViewerWindow = await messenger.windows.create(
      {
        url:                 eventLogViewerUrl,
        type:                "popup",
        titlePreface:        getI18nMsg("options_fsbOptionsTitle") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "showEventLogViewer -- Backup File Viewer Popup Window Created --"
                + `\n-from ourTabId="${ourTabId}"`
                + `\n-from ourWindowId="${ourWindowId}"`
                + `\n-eventLogViewerWindow.id="${eventLogViewerWindow.id}"`
////////////////+ `\n-URL="${eventLogViewerUrl}"`
              );

    // Re-focus on the eventLogViewer window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE eventLogViewerPrompt() ???
////MABXXX const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, eventLogViewerWindow.id);
////MABXXX messenger.windows.onFocusChanged.addListener(focusListener);

    // EventLogViewerResponse - expected:
    // - null                     - the user closed the popup window   (set by our own windows.onRemoved listener - the defaultResponse sent to eventLogViewerPrompt)
    // - CLOSED                   - the user closed the popup window   (sent by the LogViewer window's window.onClosed listener)
    // - DONE                     - the user clicked the Done button   (sent by the LogViewer window's Done button listener)
    // - { 'DELETED': fileName }  - the user clicked the Delete button (sent by the LogViewer window's Delete button listener)

    const eventLogViewerResponse = await this.eventLogViewerPrompt(eventLogViewerWindow.id, null);
    this.debug(`showEventLogViewer -- LogViewer eventLogViewerResponse="${eventLogViewerResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (eventLogViewerResponse) {
      case 'DONE':
      case 'CLOSED':
      case null:
        break;
      default: {
        if (! typeof (eventLogViewerResponse === 'object')) {
          this.error(`showEventLogViewer -- UNKNOWN LogViewer Response - NOT A KEYWORD OR OBJECT: "${eventLogViewerResponse}"`);

        } else {
          if (! eventLogViewerResponse.hasOwnProperty('DELETED')) {
            this.error(`showEventLogViewer -- UNKNOWN LogViewer Response - Object has No 'DELETED' Property: "${eventLogViewerResponse}"`);

          } else {
            const fileName = eventLogViewerResponse.DELETED;
            if (typeof fileName !== 'string') {
              this.error(`showEventLogViewer -- MALFORMED LogViewer Response - Invalid 'DELETED' Property type - expected 'string', got: '${typeof fileName}'`);

            } else {
              // MABXXX Perhaps it wold be better for *US* to actually delete the Log File...
              this.debug(`showEventLogViewer -- Log File '${fileName}' was deleted`);
              const selector         = `tr.filename-list-item[fileName='${fileName}']`;
              const domDeletedFileTR = document.querySelector(selector);

              if (! domDeletedFileTR) {
                this.error(`showEventLogViewer -- Failed to select deleted file item, selector="${selector}"`);
              } else {
                this.log(`showEventLogViewer -- Removing deleted file item, selector="${selector}"`);
                domDeletedFileTR.remove(); // why bother with this if we're just going to call buildFileNameListUI() ???
//              const domeventLogManager = document.getElementById("fsbEventLogManager"); // MABXXX attempting to force re-layout
//              if (domeventLogManager) domeventLogManager.offsetHeight;                  // MABXXX attempting to force re-layout
////////////////this.updateUIOnSelectionChanged();
////////////////this.updateUIAfterDelete();
                await this.buildFileNameListUI(); // deleting probably created a new log file
              }
            }
          }
        }
      }
    }
  }



  async eventLogViewerPrompt(eventLogViewerWindowId, defaultResponse) {
    try {
      await messenger.windows.get(eventLogViewerWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "eventLogViewerPrompt -- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId == eventLogViewerWindowId) {

          messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);

          resolve(response);
        }
      }

      /* The LogViewer sends a message as EventLogViewerResponse:
       *  - CLOSED                   - the user closed the popup window   (sent by the LogViewer window's window.onClosed listener)
       *  - DONE                     - the user clicked the Done button   (sent by the LogViewer window's Done button listener)
       *  - { 'DELETED': fileName }  - the user clicked the Delete button (sent by the LogViewer window's Delete button listener)
       * Save this EventLogViewerResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId == eventLogViewerWindowId && request && request.hasOwnProperty('EventLogViewerResponse')) {
          response = request.EventLogViewerResponse;
        }

        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async archiveButtonClicked(e) {
    this.debug(`archiveButtonClicked -- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    await this.archiveSelectedFiles(e);
  }

  async archiveSelectedFiles(e) {
    const archiveBtn = document.getElementById("fsbEventLogManagerDeleteButton");
    archiveBtn.disabled = true;

    const domSelectedFileNameItemTRs = this.getSelectedDomFileNameListItems();
    let errors = 0;

    if (! domSelectedFileNameItemTRs) {
      this.error("archiveSelectedFiles -- NO FILENAMES SELECTED -- Archive Button should have been disabled!!!");

    } else {
      this.debug(`archiveSelectedFiles -- domSelectedFileNameItemTRs.length=${domSelectedFileNameItemTRs.length}`);

      var archived = 0;
      for (const domSelectedFileNameItemTR of domSelectedFileNameItemTRs) {
        const eventLogName = domSelectedFileNameItemTR.getAttribute("fileName");
        this.debug(`archiveSelectedFiles -- Archiving Log FIle eventLogName="${eventLogName}"`);

        const response = await this.archiveEventLog(eventLogName);
        if (! response) {
          this.error(`archiveSelectedFiles -- FAILED TO ARCHIVE LOG FILE -- NO RESPONSE RETURNED -- eventLogName="${eventLogName}"`);
          ++errors;
        } else if (response.invalid) {
          this.error(`archiveSelectedFiles -- FAILED TO ARCHIVE LOG FILE -- INVALID RETURNED -- eventLogName="${eventLogName}"`);
          ++errors;
        } else if (response.error) {
          this.error(`archiveSelectedFiles -- FAILED TO ARCHIVE LOG FILE -- ERROR RETURNED -- eventLogName="${eventLogName}"`);
          ++errors;
        } else if (! response.eventLogName) {
          this.error(`archiveSelectedFiles -- FAILED TO ARCHIVE LOG FILE -- NO LOG FILENAME RETURNED -- eventLogName="${eventLogName}"`);
          ++errors;
        } else if (! response.archiveFileName) {
          this.error(`archiveSelectedFiles -- FAILED TO ARCHIVE LOG FILE -- NO ARCHIVE FILENAME RETURNED -- response.eventLogName="${response.eventLogName}"`);
          ++errors;
        } else if (! response.archived) {
          this.error(`archiveSelectedFiles -- FAILED TO ARCHIVE LOG FILE -- response.eventLogName="${response.eventLogName}" response.archiveFileName="${response.archiveFileName}" response.archived="${response.archived}"`);
          ++errors;
        } else {
          this.debug(`archiveSelectedFiles -- Log File Archived -- response.eventLogName="${response.eventLogName}" response.archiveFileName="${response.archiveFileName}" response.archived="${response.archived}"`);
          ++archived;
          domSelectedFileNameItemTR.remove();
        }
      }

      if (errors) {
        this.setErrorFor("fsbEventLogManagerInstructions", "fsbEventLogManager_message_error_archiveFailed");
      } else if (archived) {
        // MABXXX NO RESPONSE MESSAGE REQUIRED FOR LOG FILE ARCHIVE
//      const responseMessage = { 'ARCHIVED': archived };
//
//      this.debug(`archiveSelectedFiles -- Sending responseMessage="${responseMessage}"`);
//
//      try {
//        await messenger.runtime.sendMessage(
//          { eventLogManagerResponse: responseMessage }
//        );
//      } catch (error) {
//        this.caught( error, 
//                     "archiveSelectedFiles ##### SEND RESPONSE MESSAGE FAILED #####"
//                     + `\n- responseMessage="${responseMessage}"`
//                   );
//        ++errors;
//        this.setErrorFor("fsbEventLogManagerInstructions", "fsbEventLogManager_message_error_responseMessageFailed");
//      }
      }
    }

    if (errors) {
      // MABXXX ERROR MESSAGE
    } else {
    }

    this.updateUIOnSelectionChanged();

    archiveBtn.disabled = false;
  }



  async deleteButtonClicked(e) {
    this.debug(`deleteButtonClicked -- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    await this.deleteSelectedFiles(e);
  }

  async deleteSelectedFiles(e) {
    const deleteBtn = document.getElementById("fsbEventLogManagerDeleteButton");
    deleteBtn.disabled = true;

    const domSelectedFileNameItemTRs = this.getSelectedDomFileNameListItems();
    let errors = 0;

    if (! domSelectedFileNameItemTRs) {
      this.error("deleteSelectedFiles -- NO FILENAMES SELECTED -- Delete Button should have been disabled!!!");

    } else {
      this.debug(`deleteSelectedFiles -- domSelectedFileNameItemTRs.length=${domSelectedFileNameItemTRs.length}`);

      var deleted = 0;
      for (const domSelectedFileNameItemTR of domSelectedFileNameItemTRs) {
        const eventLogName = domSelectedFileNameItemTR.getAttribute("fileName");
        this.debug(`deleteSelectedFiles -- Deleting Log File eventLogName="${eventLogName}"`);

        const response = await this.deleteEventLog(eventLogName);
        if (! response) {
          this.error(`deleteSelectedFiles -- FAILED TO DELETE LOG FILE -- NO RESPONSE RETURNED -- eventLogName="${eventLogName}"`);
          ++errors;
        } else if (response.invalid) {
          this.error(`deleteSelectedFiles -- FAILED TO DELETE LOG FILE -- INVALID RETURNED -- eventLogName="${eventLogName}"`);
          ++errors;
        } else if (response.error) {
          this.error(`deleteSelectedFiles -- FAILED TO DELETE LOG FILE -- ERROR RETURNED -- eventLogName="${eventLogName}"`);
          ++errors;
        } else if (! response.fileName) {
          this.error(`deleteSelectedFiles -- FAILED TO DELETE LOG FILE -- NO FILENAME RETURNED -- eventLogName="${eventLogName}"`);
          ++errors;
        } else if (! response.deleted) {
          this.error(`deleteSelectedFiles -- FAILED TO DELETE LOG FILE -- eventLogName="${eventLogName}" response.deleted="${response.deleted}"`);
          ++errors;
        } else {
          this.debug(`deleteSelectedFiles -- Log File Deleted -- eventLogName="${eventLogName}" response.deleted="${response.deleted}"`);
          ++deleted;
          domSelectedFileNameItemTR.remove();
        }
      }

      if (errors) {
        this.setErrorFor("fsbEventLogManagerInstructions", "fsbEventLogManager_message_error_deleteFailed"); /* I18N */
      } else if (deleted) {
////////this.updateUIOnSelectionChanged();
////////this.updateUIAfterDelete();
        await this.buildFileNameListUI(); // deleting probably created a new log file

        // MABXXX NO RESPONSE MESSAGE REQUIRED FOR LOG FILE DELETE
//      const responseMessage = { 'DELETED': deleted };
//
//      this.debug(`deleteSelectedFiles -- Sending responseMessage="${responseMessage}"`);
//
//      try {
//        await messenger.runtime.sendMessage(
//          { eventLogManagerResponse: responseMessage }
//        );
//      } catch (error) {
//        this.caught( error, 
//                     "deleteSelectedFiles ##### SEND RESPONSE MESSAGE FAILED #####"
//                     + `\n- responseMessage="${responseMessage}"`
//                   );
//        ++errors;
//        this.setErrorFor("fsbEventLogManagerInstructions", "fsbEventLogManager_message_error_responseMessageFailed"); /* I18N */
//      }
      }
    }

    if (errors) {
      // MABXXX ERROR MESSAGE
      deleteBtn.disabled = false;
    } else {
    }

  }



  resetErrors() {
    let errorDivs = document.querySelectorAll("div.log-error");
    if (errorDivs) {
      for (let errorDiv of errorDivs) {
        errorDiv.setAttribute("error", "false");
      }
    }

    let errorLabels = document.querySelectorAll("label.log-error-text");
    if (errorLabels) {
      for (let errorLabel of errorLabels) {
        errorLabel.setAttribute("error", "false");
        errorLabel.innerText = ""; // MABXXX THIS IS A HUGE LESSON:  DO NOT USE: <label/>   USE: <label></label> 
      }
    }
  }

  setErrorFor(elementId, msgId) {
    if (elementId && msgId) {
      let errorDiv = document.querySelector("div.log-error[error-for='" + elementId + "']");
      if (errorDiv) {
        errorDiv.setAttribute("error", "true");
      }

      let errorLabel = document.querySelector("label.log-error-text[error-for='" + elementId + "']");
      if (errorLabel) {
        let i18nMessage = getI18nMsg(msgId);
        errorLabel.innerText = i18nMessage;
      }
    }
  }



  async doneButtonClicked(e) {
    this.debug(`doneButtonClicked -- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    this.canceled = true;

    const responseMessage = "DONE";
    this.debug(`doneButtonClicked -- Sending responseMessage="${responseMessage}"`);
    try {
      await messenger.runtime.sendMessage(
        { eventLogManagerResponse: responseMessage }
      );
    } catch (error) {
      // any need to tell the user???
      this.caught( error,
                   "doneButtonClicked ##### SEND RESPONSE MESSAGE FAILED #####"
                   + `\n- responseMessage="${responseMessage}"`
                 );
    }

    this.debug("doneButtonClicked -- Closing window");
    window.close();
  }



  /* returns { "fileNames": [],    "length": number }
   *         { "error":     string                   } If there was some error writing the file. The returned string gives the reason.
   */
  async listEventLogs() {
    try {
      let matchGLOB = this.LOG_FILENAME_MATCH_GLOB;
      if (this.listMode === this.LIST_MODE_ARCHIVES) matchGLOB = this.ARCHIVE_FILENAME_MATCH_GLOB;
      this.debug(`listEventLogs -- Getting list of log files with matchGLOB "${matchGLOB}"`);
      const response = await this.fsBrokerApi.listFiles(matchGLOB);
      this.debug(`listEventLogs --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "listEventLogs -- Unexpected Error");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileInfo": [],    "length": number } array of FileInfo - see the FileSystemBroker API README file
   *         { "error":    string                  } If there was some error writing the file. The returned string gives the reason.
   */
  async listEventLogInfo() {
    try {
      let matchGLOB = this.LOG_FILENAME_MATCH_GLOB;
      if (this.listMode === this.LIST_MODE_ARCHIVES) matchGLOB = this.ARCHIVE_FILENAME_MATCH_GLOB;
      this.debug(`listEventLogInfo -- Getting list of log files with matchGLOB "${matchGLOB}"`);
      const response = await this.fsBrokerApi.listFileInfo(matchGLOB);
      this.debug(`listEventLogInfo --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "listEventLogInfo -- Unexpected Error");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileName": string, "data": UTF8-String, "lineData": array of object } array of javascript object
   *         { "invalid":  string                                                   } If fileName invalid or the full pathName too long. The returned string gives the reason.
   *         { "error":    string                                                   } If there was some error reading the file. The returned string gives the reason.
   */
  async readEventLog(fileName) {
    try {
      this.debug(`readEventLog -- Reading log file "${fileName}"`);
      const response = await this.fsBrokerApi.readFile(fileName);
      //this.debug("readEventLog -- response:", response);
      //this.debug(`readEventLog -- response.data: "${response.data}"`);

      if (response.data) {
        const lines    = response.data.split('\n');
        const lineData = [];

        for (const line of lines) {
          //this.debug(`readEventLog -- line: "${line}"`);
          if (line.length >= 1) {
            try {
              const obj = JSON.parse(line);
              lineData.push(obj);
            } catch (error) {
              this.caught(error, `readEventLog -- Unexpected Error parsing JSON: "${line}"`);
            }
          }
        }

        response['lineData'] = lineData;
      }

      return response;

    } catch (error) {
      this.caught(error, "readEventLog -- Unexpected Error");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "eventLogName": string, "archiveFileName": string, "archived": boolean }
   *         { "invalid":     string                                                 } If eventLogName invalid. The returned string gives the reason.
   *         { "error":       string                                                 } If there was some error deleting the file. The returned string gives the reason.
   */
  async archiveEventLog(eventLogName) {
    const nowMS = Date.now();

    try {
//  this.LOG_FILENAME_EXTENSION      = ".log";
//  this.ARCHIVE_FILENAME_EXTENSION  = ".alog";
      const dotLogIndex = eventLogName.indexOf(this.LOG_FILENAME_EXTENSION);
      if (dotLogIndex == -1) {
        this.error(`archiveEventLog -- eventLogName does not end with "${this.LOG_FILENAME_EXTENSION}": "${eventLogName}"`);
        return { "invalid": `eventLogName does not end with "${this.LOG_FILENAME_EXTENSION}": "${eventLogName}"` };
      }
      const timestamp       = formatMsToTimeForFilename(nowMS);
      const archiveFileName = eventLogName.substring(0, dotLogIndex) + "_" + timestamp + this.ARCHIVE_FILENAME_EXTENSION;

      this.debug(`archiveEventLog -- Renaming log file "${eventLogName}" to "${archiveFileName}" `);
      const response = await this.fsBrokerApi.renameFile(eventLogName, archiveFileName, true);
      this.debug(`archiveEventLog --response: "${response}"`);

      if (response.renamed !== true) {
        this.error(`archiveEventLog -- Failed to rename file "${eventLogName}" to "${archiveFileName}" `);
        return { "error": `Failed to archive log file "${eventLogName}"` };
      }

      this.debug(`archiveEventLog -- Successfully archived log file "${eventLogName}" to "${archiveFileName}" `);
      return { "eventLogName": eventLogName, "archiveFileName": archiveFileName, "archived": true };

    } catch (error) {
      this.caught(error, `archiveEventLog --  Failed to archive log file "${eventLogName}"`);
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileName": string, "deleted": boolean }
   *         { "invalid":  string                     } If fileName invalid or pathName too long. The returned string gives the reason.
   *         { "error":    string                     } If there was some error deleting the file. The returned string gives the reason.
   */
  async deleteEventLog(fileName) {
    try {
      this.debug(`deleteEventLog -- Deleting log file "${fileName}"`);
      const response = await this.fsBrokerApi.deleteFile(fileName);
      this.debug(`deleteEventLog --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, `deleteEventLog --  Failed to delete log file "${fileName}"`);
      return { "error": error.name + ": " + error.message };
    }
  }
}



const eventLogManager = new EventLogManager();

document.addEventListener("DOMContentLoaded", (e) => eventLogManager.run(e), {once: true});
