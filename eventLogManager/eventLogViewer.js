import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { FsbOptions          } from '../modules/options.js';
import { Logger              } from '../modules/logger.js';
import { parseDocumentLocation, getI18nMsg, formatMsToDateTime24HR , formatMsToDateTime12HR } from '../utilities.js';




class EventLogViewer {
  constructor() {
    this.CLASS_NAME    = this.constructor.name;

    this.LOG_FILENAME_EXTENSION  = ".log";
    this.LOG_FILENAME_MATCH_GLOB = "*.log";

    this.LOG           = false;
    this.DEBUG         = false;

    this.logger        = new Logger();
    this.fsbOptionsApi = new FsbOptions(this.logger);
    this.fsBrokerApi   = new FileSystemBrokerAPI();



    this.MODE_LOGS     = 'logs';
    this.MODE_ARCHIVES = 'archives';
    this.mode;
    this.logFileName;
    this.logFileInfo;
    this.canceled      = false;


    this.i18nText_filterByTimeHourSelect_optionNone   = getI18nMsg( "fsbEventLogViewer_filterByTimeHourSelect_optionNone",   "--"         );
    this.i18nText_filterByTimeMinuteSelect_optionNone = getI18nMsg( "fsbEventLogViewer_filterByTimeMinuteSelect_optionNone", "--"         );
    this.i18nText_filterBySenderSelect_optionNone     = getI18nMsg( "fsbEventLogViewer_filterBySenderSelect_optionNone",     "--select--" );
    this.i18nText_filterByTypeSelect_optionNone       = getI18nMsg( "fsbEventLogViewer_filterByTypeSelect_optionNone",       "--select--" );
    this.i18nText_filterByCommandSelect_optionNone    = getI18nMsg( "fsbEventLogViewer_filterByCommandSelect_optionNone",    "--select--" );
    this.i18nText_filterByStatusSelect_optionNone     = getI18nMsg( "fsbEventLogViewer_filterByStatusSelect_optionNone",     "--select--" );
    this.i18nText_filterBySenderSelect_optionBlank    = getI18nMsg( "fsbEventLogViewer_filterBySenderSelect_optionBlank",    "???"        );
    this.i18nText_filterByTypeSelect_optionBlank      = getI18nMsg( "fsbEventLogViewer_filterByTypeSelect_optionBlank",      "???"        );
    this.i18nText_filterByCommandSelect_optionBlank   = getI18nMsg( "fsbEventLogViewer_filterByCommandSelect_optionBlank",   "???"        );
    this.i18nText_filterByStatusSelect_optionBlank    = getI18nMsg( "fsbEventLogViewer_filterByStatusSelect_optionBlank",    "???"        );
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
    await this.localizePage();

    const thisWindow      = await messenger.windows.getCurrent();
    const docLocationInfo = parseDocumentLocation(document);
    const params          = docLocationInfo.params;
    let   mode; // 'logs' or 'archives'
    let   fileName; 
    let   fileInfo; 

    if (params) {
      mode = params.get('mode');
      this.debug(`run -- mode="${mode}"`);
      fileName = params.get('fileName');
      this.debug(`run -- fileName="${fileName}"`);
    }

    if (! mode) {
      this.error("run ##### No mode paramter was provided #####");
      this.setErrorFor("instructions", "fsbEventLogViewer_error_noMode");
    } else {
      this.mode = mode;
    }

    if (! fileName) {
      this.error("run ##### No fileName paramter was provided #####");
      this.setErrorFor("instructions", "fsbEventLogViewer_error_noFileName");
    } else {
      this.logFileName = fileName;
      const response = await this.getLogFileInfo(fileName);
      fileInfo = response.fileInfo;
    }

    if (! fileInfo) {
      this.error("run ##### Failed to get FileInfo  #####");
      this.setErrorFor("instructions", "fsbEventLogViewer_error_noFileInfo");
    } else {
      this.logFileInfo = fileInfo;
      await this.updateLogFileInfoUI(fileInfo);
      await this.buildFileDataUI(fileInfo);
    }

    this.setupEventListeners();
  }



  setupEventListeners() {
    const filterByStartHourSelect   = document.getElementById( "fsbEventLogViewer_filterByStartTimeHourSelect"   );
    const filterByStartMinuteSelect = document.getElementById( "fsbEventLogViewer_filterByStartTimeMinuteSelect" );
    const filterByEndHourSelect     = document.getElementById( "fsbEventLogViewer_filterByEndTimeHourSelect"     );
    const filterByEndMinuteSelect   = document.getElementById( "fsbEventLogViewer_filterByEndTimeMinuteSelect"   );
    filterByStartHourSelect.addEventListener(   "change", (e) => this.filterByStartTimeHourSelectChanged(e)   );
    filterByStartMinuteSelect.addEventListener( "change", (e) => this.filterByStartTimeMinuteSelectChanged(e) );
    filterByEndHourSelect.addEventListener(     "change", (e) => this.filterByEndTimeHourSelectChanged(e)     );
    filterByEndMinuteSelect.addEventListener(   "change", (e) => this.filterByEndTimeMinuteSelectChanged(e)   );

    const filterBySenderSelect  = document.getElementById( "fsbEventLogViewer_filterBySenderSelect"  );
    const filterByTypeSelect    = document.getElementById( "fsbEventLogViewer_filterByTypeSelect"    );
    const filterByCommandSelect = document.getElementById( "fsbEventLogViewer_filterByCommandSelect" );
    const filterByStatusSelect  = document.getElementById( "fsbEventLogViewer_filterByStatusSelect"  );
    filterBySenderSelect.addEventListener(  "change", (e) => this.filterBySenderSelectChanged(e)  );
    filterByTypeSelect.addEventListener(    "change", (e) => this.filterByTypeSelectChanged(e)    );
    filterByCommandSelect.addEventListener( "change", (e) => this.filterByCommandSelectChanged(e) );
    filterByStatusSelect.addEventListener(  "change", (e) => this.filterByStatusSelectChanged(e)  );

    const filterByTimeResetButton    = document.getElementById( "fsbEventLogViewer_filterByTimeResetButton"    );
    const filterBySenderResetButton  = document.getElementById( "fsbEventLogViewer_filterBySenderResetButton"  );
    const filterByTypeResetButton    = document.getElementById( "fsbEventLogViewer_filterByTypeResetButton"    );
    const filterByCommandResetButton = document.getElementById( "fsbEventLogViewer_filterByCommandResetButton" );
    const filterByStatusResetButton  = document.getElementById( "fsbEventLogViewer_filterByStatusResetButton"  );
    const filterResetAllButton       = document.getElementById( "fsbEventLogViewer_filterResetAllButton"       );
    filterByTimeResetButton.addEventListener(    "click", (e) => this.filterByTimeResetButtonClicked(e)    );
    filterBySenderResetButton.addEventListener(  "click", (e) => this.filterBySenderResetButtonClicked(e)  );
    filterByTypeResetButton.addEventListener(    "click", (e) => this.filterByTypeResetButtonClicked(e)    );
    filterByCommandResetButton.addEventListener( "click", (e) => this.filterByCommandResetButtonClicked(e) );
    filterByStatusResetButton.addEventListener(  "click", (e) => this.filterByStatusResetButtonClicked(e)  );
    filterResetAllButton.addEventListener(       "click", (e) => this.filterResetAllButtonClicked(e)       );

    filterByStartMinuteSelect.disabled = true; // enabled only when an hour is selected
    filterByEndMinuteSelect.disabled   = true; // enabled only when an hour is selected

    const deleteBtn = document.getElementById("fsbEventLogViewerDeleteButton");
    deleteBtn.addEventListener("click", (e) => this.deleteButtonClicked(e));

    const doneBtn = document.getElementById("fsbEventLogViewerDoneButton");
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



  async updateLogFileInfoUI(fileInfo) {
    const logFileNameLabel             = document.getElementById("fsbEventLogViewerFileName");
    const logFileCreationTimeLabel     = document.getElementById("fsbEventLogViewerFileCreationTime");
    const logFileLastModifiedTimeLabel = document.getElementById("fsbEventLogViewerFileLastModifiedTime");
    const logFileSizeLabel             = document.getElementById("fsbEventLogViewerFileSize");

    logFileNameLabel.textContent             = fileInfo.fileName;
    logFileCreationTimeLabel.textContent     = formatMsToDateTime12HR(fileInfo.creationTime);
    logFileLastModifiedTimeLabel.textContent = formatMsToDateTime12HR(fileInfo.lastModified);
    logFileSizeLabel.textContent             = await messenger.messengerUtilities.formatFileSize(fileInfo.size) + " (" + fileInfo.size + ")";
  }



  async windowUnloading(e) {
    if (this.DEBUG) this.debugAlways( "windowUnloading --- Window Unloading ---"
                                      + `\n- window.screenTop=${window.screenTop}`
                                      + `\n- window.screenLeft=${window.screenLeft}`
                                      + `\n- window.outerWidth=${window.outerWidth}`
                                      + `\n- window.outerHeight=${window.outerHeight}`
                                      + `\n- this.canceled=${this.canceled}`
                                    );
    await this.fsbOptionsApi.storeWindowBounds("eventLogViewerWindowBounds", window);

    if (this.DEBUG) {
      let bounds = await this.fsbOptionsApi.getWindowBounds("eventLogViewerWindowBounds");

      if (! bounds) {
        this.debugAlways("windowUnloading --- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- FAILED TO GET Log Viewer Window Bounds ---");
      } else if (typeof bounds !== 'object') {
        this.error(`windowUnloading --- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- Log Viewer Window Bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
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



  async buildFileDataUI(fileInfo) {
    this.debug(`buildFileDataUI --- fileName="${fileInfo.fileName}"`);

    this.clearFilterPanelMessages();

    const domFileDataList = document.getElementById("fsbEventLogViewerFileData");
    if (! domFileDataList) {
      this.debug("run -- failed to get domFileData");
      this.setErrorFor("instructions", "fsbEventLogViewer_error_internal");
      return;
    }

    const i18nMessage = getI18nMsg("fsbEventLogViewer_message_fileDataLoading", "...");
    this.appendLogLineMessageUI(domFileDataList, i18nMessage);

    // returns { "fileName": string, "data": UTF8-String, "lineData": array of object } array of javascript object
    //         { "invalid":  string                                                   } If fileName is invalid or full pathName too long. The returned string gives the reason.
    //         { "error":    string                                                   } If there was some error reading the file. The returned string gives the reason.
    const logFileData = await this.readLogFile(fileInfo.fileName);

    domFileDataList.innerHTML = '';
    const senders  = new Set();
    const types    = new Set();
    const commands = new Set();
    const statuses = new Set();

    if (! logFileData) {
      this.appendLogLineMessageUI( domFileDataList, getI18nMsg( 'fsbEventLogViewer_error_noLogFileData_response',   "ERROR NO logFileData"          ) );
    } else if (logFileData.invalid) {
      this.appendLogLineMessageUI( domFileDataList, getI18nMsg( 'fsbEventLogViewer_error_noLogFileData_invalid',    "ERROR logFileData.invalid"     ) );
    } else if (logFileData.error) {
      this.appendLogLineMessageUI( domFileDataList, getI18nMsg( 'fsbEventLogViewer_error_noLogFileData_error',      "ERROR logFileData.error"       ) );
    } else if (! logFileData.fileName) {
      this.appendLogLineMessageUI( domFileDataList, getI18nMsg( 'fsbEventLogViewer_error_noLogFileData_noFileName', "ERROR NO logFileData.fileName" ) );
    } else if (! logFileData.data) {
      this.appendLogLineMessageUI( domFileDataList, getI18nMsg( 'fsbEventLogViewer_error_noLogFileData_noData',     "ERROR NO logFileData.data"     ) );
    } else if (! logFileData.lineData || logFileData.lineData.length < 1) {
      this.appendLogLineMessageUI( domFileDataList, getI18nMsg( 'fsbEventLogViewer_error_noLogFileData_noData',     "ERROR NO logFileData.lineData" ) );
    } else {
      const logHeaderUI = this.buildLogHeaderUI();
      domFileDataList.appendChild(logHeaderUI);

      for (const logLineData of logFileData.lineData) {
        senders.add(  logLineData.sender  ); // for building filter select list
        types.add(    logLineData.type    ); // for building filter select list
        commands.add( logLineData.command ); // for building filter select list
        statuses.add( logLineData.status  ); // for building filter select list

        const logLineItemUI = this.buildLogLineItemUI(logLineData);
        domFileDataList.appendChild(logLineItemUI);
      }

    }

    this.populateFilterSelects(senders, types, commands, statuses);
  }



  appendLogLineMessageUI(domFileDataList, msg) {
    const logLineMessageTR = document.createElement('tr');
      const logLineMessageTD = document.createElement('td');
        logLineMessageTD.style.setProperty('white-space', 'nowrap');
        logLineMessageTD.appendChild( document.createTextNode(msg) );
      logLineMessageTR.appendChild(logLineMessageTD);
    domFileDataList.appendChild(logLineMessageTR);
  }



  buildLogHeaderUI() {
    const logHeaderTR = document.createElement('tr');
      logHeaderTR.classList.add('event-header-item');

      const logLineTimestampTH =  document.createElement('th');
        logLineTimestampTH.classList.add('event-header-data');
        logLineTimestampTH.classList.add('event-header-time');
        logLineTimestampTH.appendChild( document.createTextNode( getI18nMsg('fsbEventLogViewer_listHeader_timstamp', 'TIME') ) );
      logHeaderTR.appendChild(logLineTimestampTH);

      const logLineSenderTH =  document.createElement('th');
        logLineSenderTH.classList.add('event-header-data');
        logLineSenderTH.classList.add('event-header-sender');
        logLineSenderTH.appendChild( document.createTextNode( getI18nMsg('fsbEventLogViewer_listHeader_sender', 'SENDER') ) );
      logHeaderTR.appendChild(logLineSenderTH);

      const logLineTypeTH =  document.createElement('th');
        logLineTypeTH.classList.add('event-header-data');
        logLineTypeTH.classList.add('event-header-type');
        logLineTypeTH.appendChild( document.createTextNode( getI18nMsg('fsbEventLogViewer_listHeader_type', 'TYPE') ) );
      logHeaderTR.appendChild(logLineTypeTH);

      const logLineCommandTH =  document.createElement('th');
        logLineCommandTH.classList.add('event-header-data');
        logLineCommandTH.classList.add('event-header-command');
        logLineCommandTH.appendChild( document.createTextNode( getI18nMsg('fsbEventLogViewer_listHeader_command', 'COMMAND') ) );
      logHeaderTR.appendChild(logLineCommandTH);

      const logLineStatusTH =  document.createElement('th');
        logLineStatusTH.classList.add('event-header-data');
        logLineStatusTH.classList.add('event-header-status');
        logLineStatusTH.appendChild( document.createTextNode( getI18nMsg('fsbEventLogViewer_listHeader_status', 'STATUUS') ) );
      logHeaderTR.appendChild(logLineStatusTH);

      const logLineParametersTH =  document.createElement('th');
        logLineParametersTH.classList.add('event-header-data');
        logLineParametersTH.classList.add('event-header-parameters');
        logLineParametersTH.appendChild( document.createTextNode( getI18nMsg('fsbEventLogViewer_listHeader_parameters', 'PARAMETERS') ) );
      logHeaderTR.appendChild(logLineParametersTH);

      const logLineResultTH =  document.createElement('th');
        logLineResultTH.classList.add('event-header-data');
        logLineResultTH.classList.add('event-header-result');
        logLineResultTH.appendChild( document.createTextNode( getI18nMsg('fsbEventLogViewer_listHeader_result', 'RESULT') ) );
      logHeaderTR.appendChild(logLineResultTH);

    return logHeaderTR;
  }



  /* Basically, all key/value pairs from the FileSytemBroker command object are copied into the
   * log line data, which is stored as JSON stringified objects.
   *
   * This includes the command name and any parameters.  This maybe not have been the best of ideas
   * because if a parameter happens to have the same name as one of the expected keys, like 'time',
   * 'sender', 'result', or type, etc, this will become a problem.
   *
   * Perhaps parameters could be encapsulated inside their own object???
   */
  formatCommandParameters(logLineData) { // MABXXX Move to FileSystemBrokerCommands ???
    let formattedParameters = '';

    if (logLineData.command) {
      for (const[key, value] of Object.entries(logLineData)) {
        // Anything that is NOT 'timeMS, 'time', 'sender', 'command', 'status', 'result', or 'type' is a 'parameter'
        switch (key) {
          case 'timeMS':
          case 'time':
          case 'sender':
          case 'type':
          case 'command':
          case 'status':
          case 'result':
            break;
          default: {
            let param = '';
            if (typeof value === 'object') {
              if (Array.isArray(value)) {
                param = `${key}=Array length=${value.length}`; // maybe expand the array?
              } else {
                param = `${key}=Object entries=${Object.keys(value).length}`; // maybe expand the object?
              }
            } else if (typeof value === 'string') {
              param = `${key}="${value}"`;
            } else {
              param = `${key}=${value}`;
            }
            if (formattedParameters !== '') {
              formattedParameters += ", ";
            }
            formattedParameters += param;
          }
        }
      }
    }

    return formattedParameters;
  }



  buildLogLineItemUI(logLineData) {
    const logLineItemTR = document.createElement('tr');
      logLineItemTR.classList.add('event-line-item');

      // these will make filtering easier
      logLineItemTR.setAttribute( 'timeMS',  logLineData.timeMS  );
      logLineItemTR.setAttribute( 'time',    logLineData.time    );
      logLineItemTR.setAttribute( 'sender',  logLineData.sender  );
      logLineItemTR.setAttribute( 'type',    logLineData.type    );
      logLineItemTR.setAttribute( 'command', logLineData.command );
      logLineItemTR.setAttribute( 'status',  logLineData.status  );

      const logLineTimestampTD =  document.createElement('td');
        logLineTimestampTD.classList.add('event-line-data');
        logLineTimestampTD.classList.add('event-line-time');
        logLineTimestampTD.appendChild( document.createTextNode( formatMsToDateTime24HR(logLineData.time) ) );
      logLineItemTR.appendChild(logLineTimestampTD);

      const logLineSenderTD =  document.createElement('td');
        logLineSenderTD.classList.add('event-line-data');
        logLineSenderTD.classList.add('event-line-sender');
        if (logLineData.sender) logLineSenderTD.appendChild( document.createTextNode(logLineData.sender) );
      logLineItemTR.appendChild(logLineSenderTD);

      const logLineTypeTD =  document.createElement('td');
        logLineTypeTD.classList.add('event-line-data');
        logLineTypeTD.classList.add('event-line-type');
        if (logLineData.type) logLineTypeTD.appendChild( document.createTextNode(logLineData.type) );
      logLineItemTR.appendChild(logLineTypeTD);

      const logLineCommandTD =  document.createElement('td');
        logLineCommandTD.classList.add('event-line-data');
        logLineCommandTD.classList.add('event-line-command');
        if (logLineData.command) logLineCommandTD.appendChild( document.createTextNode(logLineData.command) );
      logLineItemTR.appendChild(logLineCommandTD);

      const logLineStatusTD =  document.createElement('td');
        logLineStatusTD.classList.add('event-line-data');
        logLineStatusTD.classList.add('event-line-status');
        if (logLineData.status) logLineStatusTD.appendChild( document.createTextNode(logLineData.status) );
      logLineItemTR.appendChild(logLineStatusTD);

      const logLineParametersTD =  document.createElement('td');
        logLineParametersTD.classList.add('event-line-data');
        logLineParametersTD.classList.add('event-line-parameters');
        logLineParametersTD.appendChild( document.createTextNode( this.formatCommandParameters(logLineData) ) );
      logLineItemTR.appendChild(logLineParametersTD);

      const logLineResultTD =  document.createElement('td');
        logLineResultTD.classList.add('event-line-data');
        logLineResultTD.classList.add('event-line-result');
        if (logLineData.result) logLineResultTD.appendChild( document.createTextNode(logLineData.result) );
      logLineItemTR.appendChild(logLineResultTD);

    return logLineItemTR;
  }



  populateFilterSelects(senders, types, commands, statuses) {
    this.populateTimeFilterSelects();

    const senderSelect  = document.getElementById( "fsbEventLogViewer_filterBySenderSelect"  );
    const typeSelect    = document.getElementById( "fsbEventLogViewer_filterByTypeSelect"    );
    const commandSelect = document.getElementById( "fsbEventLogViewer_filterByCommandSelect" );
    const statusSelect  = document.getElementById( "fsbEventLogViewer_filterByStatusSelect"  );

    senderSelect.textContent  = '';
    typeSelect.textContent    = '';
    commandSelect.textContent = '';
    statusSelect.textContent  = '';

    this.appendSetFilterOptionsToSelect( senderSelect,  senders,  this.i18nText_filterBySenderSelect_optionNone,  this.i18nText_filterBySenderSelect_optionBlank  );
    this.appendSetFilterOptionsToSelect( typeSelect,    types,    this.i18nText_filterByTypeSelect_optionNone,    this.i18nText_filterByTypeSelect_optionBlank    );
    this.appendSetFilterOptionsToSelect( commandSelect, commands, this.i18nText_filterByCommandSelect_optionNone, this.i18nText_filterByCommandSelect_optionBlank );
    this.appendSetFilterOptionsToSelect( statusSelect,  statuses, this.i18nText_filterByStatusSelect_optionNone,  this.i18nText_filterByStatusSelect_optionBlank  );
  }

  populateTimeFilterSelects() {
    const startHourSelect   = document.getElementById( "fsbEventLogViewer_filterByStartTimeHourSelect"   );
    const startMinuteSelect = document.getElementById( "fsbEventLogViewer_filterByStartTimeMinuteSelect" );
    const endHourSelect     = document.getElementById( "fsbEventLogViewer_filterByEndTimeHourSelect"     );
    const endMinuteSelect   = document.getElementById( "fsbEventLogViewer_filterByEndTimeMinuteSelect"   );

    startHourSelect.textContent   = '';
    startMinuteSelect.textContent = '';
    endHourSelect.textContent     = '';
    endMinuteSelect.textContent   = '';

    this.appendHourFilterOptionsToSelect(   startHourSelect   );
    this.appendMinuteFilterOptionsToSelect( startMinuteSelect );
    this.appendHourFilterOptionsToSelect(   endHourSelect     );
    this.appendMinuteFilterOptionsToSelect( endMinuteSelect   );
  }

  appendHourFilterOptionsToSelect(select) {
    this.appendOptionToSelect(select, -1, this.i18nText_filterByTimeHourSelect_optionNone);

    for (var i=0; i<24; ++i) {
      const value = i;
      const text  = value.toString().padStart(2, '0');
      this.appendOptionToSelect(select, value, text);
    }
  }

  appendMinuteFilterOptionsToSelect(select) {
    this.appendOptionToSelect(select, -1, this.i18nText_filterByTimeMinuteSelect_optionNone);

    for (var i=0; i<60; i+=2) {
      const value = i;
      const text  = value.toString().padStart(2, '0');
      this.appendOptionToSelect(select, value, text);
    }
  }

  appendSetFilterOptionsToSelect(select, options, defaultText, blankText) {
    const optionsArray = Array.from(options);
    const collator     = new Intl.Collator(undefined, { sensitivity: 'base' });
    optionsArray.sort(collator.compare);

    this.appendOptionToSelect(select, -1, defaultText); // this is a hack

    for (var value of optionsArray) {
      if (! value) { // or should that be '' ???
        this.appendOptionToSelect(select, '', blankText);
      } else {
        this.appendOptionToSelect(select, value, value);
      }
    }
  }

  appendOptionToSelect(select, value, text) {
    var option = document.createElement("option");
    option.value       = value;
    option.textContent = text;
    select.appendChild(option);
  }



  async filterByStartTimeHourSelectChanged(e) {
    this.filterByTimeSelectChanged(e);
  }

  async filterByStartTimeMinuteSelectChanged(e) {
    this.filterByTimeSelectChanged(e);
  }

  async filterByEndTimeHourSelectChanged(e) {
    this.filterByTimeSelectChanged(e);
  }

  async filterByEndTimeMinuteSelectChanged(e) {
    this.filterByTimeSelectChanged(e);
  }

  async filterByTimeResetButtonClicked(e) {
    e.preventDefault();
    this.clearFilterPanelMessages();
    this.resetFilterLogLinesByTimeMS();
  }

  filterByTimeSelectChanged(e) {
    this.debug(`filterByTimeSelectChanged -- e.target.tagName="${e.target.tagName}"`);

    this.clearFilterPanelMessages();

    const startHourSelect   = document.getElementById( "fsbEventLogViewer_filterByStartTimeHourSelect"   );
    const startMinuteSelect = document.getElementById( "fsbEventLogViewer_filterByStartTimeMinuteSelect" );
    const endHourSelect     = document.getElementById( "fsbEventLogViewer_filterByEndTimeHourSelect"     );
    const endMinuteSelect   = document.getElementById( "fsbEventLogViewer_filterByEndTimeMinuteSelect"   );

    const startHour   = startHourSelect.value;
    const startMinute = startMinuteSelect.value;
    const endHour     = endHourSelect.value;
    const endMinute   = endMinuteSelect.value;

    this.debug(`filterByTimeSelectChanged -- startHour=${startHour} startMinute=${startMinute} endHour=${endHour} endMinute=${endMinute}`);

    if (    (startHour === "-1" && startMinute === "-1" && endHour === "-1" && endMinute === "-1") // nothing selected
         || (startHour !== "-1" && startMinute === "-1") // start hour selected but not start minute - invalid - must select minute -- perhaps default to start-of-day?
         || (endHour   !== "-1" && endMinute   === "-1") // end   hour selected but not end   minute - invalid - must select minute -- perhaps default to end-of-day?
       )
    {
      this.removeLogLineCssClass('filter-by-time');
//////this.resetFilterLogLinesByTimeMS();
    }

    const logFileDate = new Date(+this.logFileInfo.creationTime);  // I think it may be number already, but wth
    logFileDate.setMilliseconds(0);
    logFileDate.setSeconds(0);
    logFileDate.setMinutes(0);
    logFileDate.setHours(0);

    var startDate;
    if (startHour === "-1") {
      startMinuteSelect.disabled = true;
      startMinuteSelect.value    = -1;
    } else {
      startMinuteSelect.disabled = false;
      if (startMinute !== "-1") {
        startDate = new Date(logFileDate.getTime());
        startDate.setHours(+startHour);
        startDate.setMinutes(+startMinute);
      }
    }

    var endDate;
    if (endHour === "-1") {
      endMinuteSelect.disabled = true;
      endMinuteSelect.value    = -1;
    } else {
      endMinuteSelect.disabled = false;
      if (endMinute !== "-1") {
        endDate = new Date(logFileDate.getTime());
        endDate.setHours(+endHour);
        // up to but NOT including the next minute
        endDate.setMinutes(+endMinute + 1);
        endDate.setMilliseconds(endDate.getMilliseconds() - 1);
      }
    }

    if (startDate && endDate) {
      if (startDate.getTime() > endDate.getTime()) {
        const msg = getI18nMsg("fsbEventLogViewer_message_filter_startTimeAfterEndTime");
        this.addFilterPanelMessage(msg);
      } else {
        this.filterLogLinesByTimeMS( startDate.getTime(), endDate.getTime() );
        this.checkForAllLogLinesFilteredOut();
      }
    } else if (startDate) {
      this.filterLogLinesByTimeMS( startDate.getTime(), -1 );
      this.checkForAllLogLinesFilteredOut();
    } else if (endDate) {
      this.filterLogLinesByTimeMS( -1 , endDate.getTime() );
      this.checkForAllLogLinesFilteredOut();
    }
  }

  filterLogLinesByTimeMS(startTimeMS, endTimeMS) {
    const domFileDataList    = document.getElementById("fsbEventLogViewerFileData");
    const selector           = `tr.event-line-item`;
    const matchingLogLineTRs = domFileDataList.querySelectorAll(selector);

    if (this.DEBUG) {
      const startDateTime = formatMsToDateTime24HR(startTimeMS);
      const endDateTime   = formatMsToDateTime24HR(endTimeMS);
      this.debug(`filterLogLinesByTimeMS -- start="${startDateTime}" (${startTimeMS})   end="${endDateTime}" (${endTimeMS})`);
    }

    for (const logLineTR of matchingLogLineTRs) {
      const timeMS = +logLineTR.getAttribute('timeMS');
      var filter = false;
      if (startTimeMS >= 0) {
        if (timeMS < startTimeMS) filter = true;
      }
      if (endTimeMS >= 0) {
        if (timeMS > endTimeMS) filter = true;
      }
      if (filter) {
        logLineTR.classList.add('filter-by-time');
      } else {
        logLineTR.classList.remove('filter-by-time');
      }
    }
  }

  resetFilterLogLinesByTimeMS() {
    // reset selectors
    const startHourSelect   = document.getElementById( "fsbEventLogViewer_filterByStartTimeHourSelect"   );
    const startMinuteSelect = document.getElementById( "fsbEventLogViewer_filterByStartTimeMinuteSelect" );
    const endHourSelect     = document.getElementById( "fsbEventLogViewer_filterByEndTimeHourSelect"     );
    const endMinuteSelect   = document.getElementById( "fsbEventLogViewer_filterByEndTimeMinuteSelect"   );

    startHourSelect.value      = -1
    startMinuteSelect.value    = -1;
    startMinuteSelect.disabled = true;

    endHourSelect.value      = -1
    endMinuteSelect.value    = -1;
    endMinuteSelect.disabled = true;

    this.removeLogLineCssClass('filter-by-time');
  }



  async filterBySenderSelectChanged(e) {
    this.clearFilterPanelMessages();

    const value = e.target.value;
    this.debug(`filterBySenderSelectChanged -- value="${value}"`);
    if (value === "-1") {
      this.resetFilterLogLinesBySender();
    } else {
      this.filterLogLinesBySender(value);
      this.checkForAllLogLinesFilteredOut();
    }
  }

  async filterBySenderResetButtonClicked(e) {
    this.clearFilterPanelMessages();

    this.debug(`filterBySenderResetButtonClicked -- e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.resetFilterLogLinesBySender();
  }

  filterLogLinesBySender(sender) {
    this.debug(`filterLogLinesBySender -- sender="${sender}"`);
    this.applyLogLineCssClassByAttribute('filter-by-sender', 'sender', sender);
  }

  resetFilterLogLinesBySender() {
    const filterBySenderSelect  = document.getElementById( "fsbEventLogViewer_filterBySenderSelect"  );
    filterBySenderSelect.value = -1;

    this.removeLogLineCssClass('filter-by-sender');
  }



  async filterByTypeSelectChanged(e) {
    this.clearFilterPanelMessages();

    const value = e.target.value;
    if (value === "-1") {
      this.resetFilterLogLinesByType();
    } else {
      this.filterLogLinesByType(value);
      this.checkForAllLogLinesFilteredOut();
    }
  }

  async filterByTypeResetButtonClicked(e) {
    this.clearFilterPanelMessages();

    this.debug(`filterByTypeResetButtonClicked -- e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.resetFilterLogLinesByType();
  }

  filterLogLinesByType(type) {
    this.applyLogLineCssClassByAttribute('filter-by-type', 'type', type);
  }

  resetFilterLogLinesByType() {
    const filterByTypeSelect    = document.getElementById( "fsbEventLogViewer_filterByTypeSelect"    );
    filterByTypeSelect.value = -1;

    this.removeLogLineCssClass('filter-by-type');
  }



  async filterByCommandSelectChanged(e) {
    this.clearFilterPanelMessages();

    const value = e.target.value;
    if (value === "-1") {
      this.resetFilterLogLinesByCommand();
    } else {
      this.filterLogLinesByCommand(value);
      this.checkForAllLogLinesFilteredOut();
    }
  }

  async filterByCommandResetButtonClicked(e) {
    this.clearFilterPanelMessages();

    this.debug(`filterByCommandResetButtonClicked -- e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.resetFilterLogLinesByCommand();
  }

  filterLogLinesByCommand(command) {
    this.applyLogLineCssClassByAttribute('filter-by-command', 'command', command);
  }

  resetFilterLogLinesByCommand() {
    const filterByCommandSelect = document.getElementById( "fsbEventLogViewer_filterByCommandSelect" );
    filterByCommandSelect.value = -1;

    this.removeLogLineCssClass('filter-by-command');
  }



  async filterByStatusSelectChanged(e) {
    this.clearFilterPanelMessages();

    const value = e.target.value;
    if (value === "-1") {
      this.resetFilterLogLinesByStatus();
    } else {
      this.filterLogLinesByStatus(value);
      this.checkForAllLogLinesFilteredOut();
    }
  }

  async filterByStatusResetButtonClicked(e) {
    this.clearFilterPanelMessages();

    this.debug(`filterByStatusResetButtonClicked -- e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.resetFilterLogLinesByStatus();
  }

  filterLogLinesByStatus(stat) {
    this.applyLogLineCssClassByAttribute('filter-by-status', 'status', stat);
  }

  resetFilterLogLinesByStatus() {
    const filterByStatusSelect  = document.getElementById( "fsbEventLogViewer_filterByStatusSelect"  );
    filterByStatusSelect.value = -1;
    // reset selector
    this.removeLogLineCssClass('filter-by-status');
  }



  async filterResetAllButtonClicked(e) {
    this.debug(`filterResetAllButtonClicked -- e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.clearFilterPanelMessages();

    this.resetFilterLogLinesByTimeMS();
    this.resetFilterLogLinesBySender();
    this.resetFilterLogLinesByType();
    this.resetFilterLogLinesByCommand();
    this.resetFilterLogLinesByStatus();
  }



  applyLogLineCssClassByAttribute(cssClass, attrName, attrValue) {
    this.debug(`applyLogLineCssClassByAttribute -- cssClass="${cssClass}" attrName="${attrName}" attrValue="${attrValue}" `);

    const domFileDataList    = document.getElementById("fsbEventLogViewerFileData");
    const selector           = `tr.event-line-item`;
    const matchingLogLineTRs = domFileDataList.querySelectorAll(selector);

    for (const logLineTR of matchingLogLineTRs) {
      if (logLineTR.getAttribute(attrName) === attrValue) {
        logLineTR.classList.remove(cssClass);
      } else {
        logLineTR.classList.add(cssClass);
      }
    }
  }

  removeLogLineCssClass(cssClass) {
    const domFileDataList    = document.getElementById("fsbEventLogViewerFileData");
    const selector           = `tr.event-line-item.${cssClass}`;
    const matchingLogLineTRs = domFileDataList.querySelectorAll(selector);

    for (const logLineTR of matchingLogLineTRs) {
      logLineTR.classList.remove(cssClass);
    }
  }



  checkForAllLogLinesFilteredOut() {
    if (this.getFilteredLogLineCount() < 1) {
      this.addFilterPanelMessageNoLogLinesMatch();
    }
  }



  clearFilterPanelMessages() {
    const domFilterPanelMessagesSPAN = document.getElementById("fsbEventLogViewerFiltersPanelMessages");
    if (! domFilterPanelMessagesSPAN) {
      this.error("clearFilterPanelMessages -- Failed to get Filter Panel Message <SPAN> with id=\"fsbEventLogViewerFiltersPanelMessages\"");
    } else {
      domFilterPanelMessagesSPAN.style.setProperty("display", "NONE");
//    domFilterPanelMessagesSPAN.textContent = '';
      domFilterPanelMessagesSPAN.innerHTML = '';
    }
  }

  addFilterPanelMessageNoLogLinesMatch() {
    const msg = getI18nMsg("fsbEventLogViewer_message_filter_noMatch");
    this.addFilterPanelMessage(msg);
  }

  addFilterPanelMessage(msg) {
    if (msg) {
      const domFilterPanelMessagesSPAN = document.getElementById("fsbEventLogViewerFiltersPanelMessages");
      if (! domFilterPanelMessagesSPAN) {
        this.error("addFilterPanelMessage -- Failed to get Filter Panel Messages <SPAN> with id=\"fsbEventLogViewerFiltersPanelMessages\"");
      } else {
        const msgDIV = document.createElement('div');
          msgDIV.classList.add("filter-panel-message");
          msgDIV.textContent = msg;
        domFilterPanelMessagesSPAN.appendChild(msgDIV);
        domFilterPanelMessagesSPAN.style.setProperty("display", "INLINE");
      }
    }
  }



  getFilteredLogLineCount() {
    const domFileDataList    = document.getElementById("fsbEventLogViewerFileData");
    const selector           = "tr.event-line-item";
    const matchingLogLineTRs = domFileDataList.querySelectorAll(selector);

    var count = 0;
    for (const logLineTR of matchingLogLineTRs) {
      if (! this.isFilteredLogLine(logLineTR)) count++;
    }

    return count;
  }

  isFilteredLogLine(logLineTR) {
   if (logLineTR) {
     return    logLineTR.classList.contains('filter-by-time')
            || logLineTR.classList.contains('filter-by-sender')
            || logLineTR.classList.contains('filter-by-type')
            || logLineTR.classList.contains('filter-by-command')
            || logLineTR.classList.contains('filter-by-status');
    }
    return false;
  }




  async deleteButtonClicked(e) {
    this.debug(`deleteButtonClicked -- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    const deleteBtn = document.getElementById("fsbEventLogViewerDeleteButton");
    deleteBtn.disabled = true;

    let errors = 0;
    this.debug(`deleteButtonClicked -- Deleting Options logFileName="${this.logFileName}"`);

    const response = await this.deleteLogFile(this.logFileName);
    if (! response) {
      this.error(`deleteButtonClicked -- FAILED TO DELETE OPTIONS LOG FILE -- NO RESPONSE RETURNED -- logFileName="${this.logFileName}"`);
      ++errors;
    } else if (response.invalid) {
      this.error(`deleteButtonClicked -- FAILED TO DELETE OPTIONS LOG FILE -- INVALID RETURNED -- logFileName="${this.logFileName}"`);
      ++errors;
    } else if (response.error) {
      this.error(`deleteButtonClicked -- FAILED TO DELETE OPTIONS LOG FILE -- ERROR RETURNED -- logFileName="${this.logFileName}"`);
      ++errors;
    } else if (! response.fileName) {
      this.error(`deleteButtonClicked -- FAILED TO DELETE OPTIONS LOG FILE -- NO FILENAME RETURNED -- logFileName="${this.logFileName}"`);
      ++errors;
    } else if (! response.deleted) {
      this.error(`deleteButtonClicked -- FAILED TO DELETE OPTIONS LOG FILE -- logFileName="${this.logFileName}" response.deleted="${response.deleted}"`);
      ++errors;
    } else {
      this.debug(`deleteButtonClicked -- Log File Deleted -- logFileName="${this.logFileName}" response.deleted="${response.deleted}"`);
    }

    if (errors) {
      this.setErrorFor("fsbEventLogViewerInstructions", "fsbEventLogViewer_message_error_deleteFailed");
    } else {
      const responseMessage = { 'DELETED': this.logFileName };

      this.debug(`deleteButtonClicked -- Sending responseMessage="${responseMessage}"`);

      try {
        await messenger.runtime.sendMessage(
          { EventLogViewerResponse: responseMessage }
        );
      } catch (error) {
        this.caught( error, 
                     "deleteButtonClicked ##### SEND RESPONSE MESSAGE FAILED #####"
                     + `\n- responseMessage="${responseMessage}"`
                   );
        ++errors;
        this.setErrorFor("fsbEventLogViewerInstructions", "fsbEventLogViewer_message_error_responseMessageFailed");
      }
    }

    if (errors) {
      // MABXXX ERROR MESSAGE???
    } else {
      // CLOSE THE WINDOW
      this.debug("deleteButtonClicked -- Closing window");
      window.close();
    }

    deleteBtn.disabled = false;
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

    let responseMessage = "DONE";
    this.debug(`doneButtonClicked -- Sending responseMessage="${responseMessage}"`);

    try {
      await messenger.runtime.sendMessage(
        { EventLogViewerResponse: responseMessage }
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




  /* returns { "fileName": fileName, "fileInfo": fileInfo } a FileInfo object - see the FileSystemBroker API README file
   *         { "error":    string                         } If there was some error writing the file. The returned string gives the reason.
   */
  async getLogFileInfo(fileName) {
    try {
      this.debug(`getLogFileInfo -- Getting FileInfo for Options Backup File: "${fileName}"`);
      const response = await this.fsBrokerApi.getFileInfo(fileName);
      this.debug(`getLogFileInfo --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "getLogFileInfo -- Unexpected Error");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileName": string, "data": UTF8-String, "lineData": array of object } array of javascript object
   *         { "invalid":  string                                                   } If fileName invalid or pathName too long. The returned string gives the reason.
   *         { "error":    string                                                   } If there was some error reading the file. The returned string gives the reason.
   */
  async readLogFile(fileName) {
    try {
      this.debug(`readLogFile -- Reading log file "${fileName}"`);
      const response = await this.fsBrokerApi.readFile(fileName);
      //this.debug("readLogFile -- response:", response);
      //this.debug(`readLogFile -- response.data: "${response.data}"`);

      if (response.data) {
        const lines    = response.data.split('\n');
        const lineData = [];

        for (const line of lines) {
          //this.debug(`readLogFile -- line: "${line}"`);
          if (line.length >= 1) {
            try {
              const obj = JSON.parse(line);
              lineData.push(obj);
            } catch (error) {
              this.caught(error, `readLogFile -- Unexpected Error parsing JSON: "${line}"`);
            }
          }
        }

        response['lineData'] = lineData;
      }

      return response;

    } catch (error) {
      this.caught(error, "readLogFile -- Unexpected Error");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileName": string, "deleted": boolean }
   *         { "invalid":  string                     } If fileName invalid or pathName too long. The returned string gives the reason.
   *         { "error":    string                     } If there was some error deleting the file. The returned string gives the reason.
   */
  async deleteLogFile(fileName) {
    try {
      this.debug(`deleteLogFile -- Deleting log file "${fileName}"`);
      const response = await this.fsBrokerApi.deleteFile(fileName);
      this.debug(`deleteLogFile --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, `deleteLogFile --  Failed to delete log file "${fileName}"`);
      return { "error": error.name + ": " + error.message };
    }
  }
}



const eventLogViewer = new EventLogViewer();

document.addEventListener("DOMContentLoaded", (e) => eventLogViewer.run(e), {once: true});
