import { FsbOptions } from '../modules/options.js';
import { Logger     } from '../modules/logger.js';



class ExtensionChooser {
  constructor() {
    this.className     = this.constructor.name;

    this.LOG           = false;
    this.DEBUG         = false;

    this.logger        = new Logger();
    this.fsbOptionsApi = new FsbOptions(this.logger);

    this.canceled      = false;

//  this.boundFunction1 = this.extensionButtonClicked.bind(this); // this makes sure "extensionButtonClicked" can use "this"
  }

  log(...info) {
    if (! this.LOG) return;
    const msg = info.shift();
    this.logger.log(this.className + '#' + msg, ...info);
  }

  logAlways(...info) {
    const msg = info.shift();
    this.logger.logAlways(this.className + '#' + msg, ...info);
  }

  debug(...info) {
    if (! this.DEBUG) return;
    const msg = info.shift();
    this.logger.debug(this.className + '#' + msg, ...info);
  }

  debugAlways(...info) {
    const msg = info.shift();
    this.logger.debugAlways(this.className + '#' + msg, ...info);
  }

  error(...info) {
    // always log errors
    const msg = info.shift();
    this.logger.error(this.className + '#' + msg, ...info);
  }
  
  caught(e, ...info) {
    // always log exceptions
    const msg = info.shift();
    this.logger.error( this.className + '#' + msg,
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

    document.addEventListener( "change", (e) => this.optionChanged(e) );   // One of the checkboxes or radio buttons was clicked or a select has changed

    const showInstructions = await this.fsbOptionsApi.isEnabledShowExtensionChooserInstructions();
    this.showHideInstructions(showInstructions);

    await this.updateOptionsUI();
    await this.localizePage();

    const domExtensionList = document.getElementById("fsbExtensionChooserExtensionList");
    if (! domExtensionList) {
      this.debug("run -- failed to get domExtensionList");
      // MABXXX DISPLAY MESSAGE TO USER
      return;
    }

    const installedExtensions = await messenger.management.getAll();
    const allExtensionsProps  = await this.fsbOptionsApi.getExtensionsProps();

    this.debug(`run -- installedExtensions.length=${installedExtensions.length} allExtensionsProps.length=${Object.keys(allExtensionsProps).length}`);

    let count = 0;
    if (! installedExtensions) {
      // MABXXX DISPLAY MESSAGE TO USER
   
    } else {
      installedExtensions.sort((a, b) => a.name.localeCompare(b.name, { 'sensitity': 'base' } ));

      for (const extension of installedExtensions) {
        this.debug( "run -- INSTALLED EXTENSION:"
                    + `\n- id ............ "${extension.id}"`
                    + `\n- name .......... "${extension.name}"`
                    + `\n- shortName ..... "${extension.shortName}"`
                    + `\n- type .......... "${extension.type}"`
                    + `\n- enabled ....... ${extension.enabled}`
                    + `\n- description ... "${extension.description}"`
                  );
        if (extension.type !== 'extension') {
          this.debug(`run -- SKIPPING: Installed Extension -- Type is not 'extension' -- extension.type="${extension.type}"`);

        } else {
          const configured = allExtensionsProps.hasOwnProperty(extension.id);
          if (configured) this.debug(`run -- Installed Extension is Already Configured -- extension.id="${extension.id}"`);

          const extensionListItemUI = this.buildExtensionListItemUI(extension, configured);
          domExtensionList.appendChild(extensionListItemUI);
          count++;
        }
      }

      if (! count) {
        // MABXXX DISPLAY MESSAGE TO USER
   
      } else {
      }
    }


    const cancelBtn = document.getElementById("fsbExtensionChooserPopupControlsCancelButton");
    cancelBtn.setAttribute("data", "cancel");
    cancelBtn.addEventListener("click", (e) => this.cancelButtonClicked(e));

    const addBtn = document.getElementById("fsbExtensionChooserPopupControlsAddButton");
    addBtn.setAttribute("data", "add");
    addBtn.disabled = true;
    addBtn.addEventListener("click", (e) => this.addButtonClicked(e));

    this.debug("run -- end");
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
          case "fsbShowExtensionChooserInstructions": 
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



  showHideInstructions(show) {
    this.debug(`showHideInstructions -- show=${show}`);
    const panel = document.getElementById("fsbExtensionChooserPopupInstructions");
    if (panel) {
      if (show) {
        panel.style.setProperty('display', 'block');
      } else {
        panel.style.setProperty('display', 'none');
      }
    }
  }



  buildExtensionListItemUI(extension, configured) {
    this.debug( "buildExtensionListItemUI -- BUILD LIST ITEM UI:"
                + `\n- extension.name    = "${extension.name}"`
                + `\n- extension.id      = "${extension.id}"`
                + `\n- extension.enabled = ${extension.enabled}`
                + `\n- configured        = ${configured}`
                + `\n- extension.locked  = ${extension.locked}`
              );

    const extensionTR = document.createElement("tr");
      extensionTR.classList.add("extension-list-item");                             // extension-list-item
      if (configured) {
        extensionTR.classList.add("extension-configured");                          // extension-configured
      }
      if (! extension.enabled) {
        extensionTR.classList.add("extension-disabled");                            // extension-disabled
      }
      extensionTR.setAttribute("extensionId", extension.id);
      extensionTR.setAttribute("extensionName", extension.name);
      extensionTR.addEventListener("click", (e) => this.extensionClicked(e));

      // Create Extension Status element and add it to the row
      const extensionStatusTD = document.createElement("td");
        extensionStatusTD.classList.add("extension-list-item-data");                // extension-list-item > extension-list-item-data
        extensionStatusTD.classList.add("extension-list-item-status");              // extension-list-item > extension-list-item-status

        const extensionStatusDotSpan = document.createElement("span");
          extensionStatusDotSpan .classList.add("extension-list-item-status-dot");  // extension-list-item > extension-list-item-configured > extension-list-item-status-dot
        extensionStatusTD.appendChild(extensionStatusDotSpan);
      extensionTR.appendChild(extensionStatusTD);

      // Create Extension Name element and add it to the row
      const extensionNameTD = document.createElement("td");
        extensionNameTD.classList.add("extension-list-item-data");                  // extension-list-item > extension-list-item-data
        extensionNameTD.classList.add("extension-list-item-name");                  // extension-list-item > extension-list-item-name
        extensionNameTD.appendChild(document.createTextNode(extension.name));
      extensionTR.appendChild(extensionNameTD);

      // Create Extension Id element and add it to the row
      const extensionIdTD = document.createElement("td");
        extensionIdTD.classList.add("extension-list-item-data");                    // extension-list-item > extension-list-item-data
        extensionIdTD.classList.add("extension-list-item-id");                      // extension-list-item > extension-list-item-id
        extensionIdTD.appendChild(document.createTextNode(extension.id));
      extensionTR.appendChild(extensionIdTD);

    return extensionTR;
  }  
  


  async windowUnloading(e) {
    if (this.DEBUG) this.debugAlways( "windowUnloading --- Window Unloading ---"
                                      + `\n- window.screenTop=${window.screenTop}`
                                      + `\n- window.screenLeft=${window.screenLeft}`
                                      + `\n- window.outerWidth=${window.outerWidth}`
                                      + `\n- window.outerHeight=${window.outerHeight}`
                                      + `\n- this.canceled=${this.canceled}`
                                    );
    await this.fsbOptionsApi.storeWindowBounds("extensionChooserWindowBounds", window);

    if (this.DEBUG) {
      let bounds = await this.fsbOptionsApi.getWindowBounds("extensionChooserWindowBounds");

      if (! bounds) {
        this.debugAlways("windowUnloading --- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- FAILED TO GET Extension Chooser Window Bounds ---");
      } else if (typeof bounds !== 'object') {
        this.debugAlways(`windowUnloading --- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- Extension Chooser Window Bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
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



  // and extension-list-item (TR or TD) was clicked
  async extensionClicked(e) {
    if (! e) return;

////e.stopPropagation();
////e.stopImmediatePropagation();

    this.debug(`extensionClicked -- e.target.tagName="${e.target.tagName}"`);

    if (e.target.tagName == "TR" || e.target.tagName == "TD") {
      this.debug("extensionClicked -- TR or TD Clicked");

      let trElement = e.target;
      if (e.target.tagName == "TD") {
        trElement = e.target.closest('tr');
      }

      if (! trElement) {
        this.debug("extensionClicked -- Did NOT get our TR");

      } else {
        this.debug(  "extensionClicked -- Got our TR --"
                    + ` extension-list-item? ${trElement.classList.contains("extension-list-item")}`
                    + ` extension-configured? ${trElement.classList.contains("extension-configured")}`
                  );
        if (trElement.classList.contains("extension-list-item") && ! trElement.classList.contains("extension-configured")) {
          const extensionName = trElement.getAttribute("extensionName");
          const extensionId   = trElement.getAttribute("extensionId");
          const selected      = trElement.classList.contains('selected');
      
          this.debug(`extensionlicked -- selected=${selected}  extensionName="${extensionName}" extensionId="${extensionId}"`);

          if (! selected) {
            trElement.classList.add('selected');
          } else {
            trElement.classList.remove('selected');
          }

          const selectedExtensionListCount = this.getSelectedDomExtensionListItemCount();
          const addBtn                = document.getElementById("fsbExtensionChooserPopupControlsAddButton");
          if (selectedExtensionListCount) {
            addBtn.disabled = false;
          } else {
            addBtn.disabled = true;
          }
        }
      }
    }
  }



  getSelectedDomExtensionListItemCount() {
    const domExtensionList   = document.getElementById("fsbExtensionChooserExtensionList");
    const extensionListItems = domExtensionList.children;

    let count = 0;
    for (const extensionListItem of extensionListItems) {
      if (extensionListItem.classList.contains('selected')) count++;
    }

    return count;
  }



  getSelectedDomExtensionListItems() {
    const domExtensionList        = document.getElementById("fsbExtensionChooserExtensionList");
    const domExtensionListItemTRs = domExtensionList.children;

    const selectedDomExtensionItemTRs = [];
    for (const domExtensionListItemTR of domExtensionListItemTRs) {
      if (domExtensionListItemTR.classList.contains('selected')) {
        selectedDomExtensionItemTRs.push(domExtensionListItemTR);
      }
    }

    return selectedDomExtensionItemTRs;
  }



  async addButtonClicked(e) {
    this.debug(`addButtonClicked -- e.target.tagName="${e.target.tagName}"`);

    const addBtn = document.getElementById("fsbExtensionChooserPopupControlsAddButton");
    addBtn.disabled = true;

    const domSelectedExtensionItemTRs = this.getSelectedDomExtensionListItems();

    let count = 0;
    if (! domSelectedExtensionItemTRs) {
      this.error("addButtonClicked -- NO EXTENSIONS SELECTED -- Save Button should have been disabled!!!");

    } else {
      for (const domExtensionItemTR of domSelectedExtensionItemTRs) {
        this.debug(`addButtonClicked -- domExtensionItemTR=${domExtensionItemTR} domExtensionItemTR.tagName="${domExtensionItemTR.tagName}"`);

        const domExtensionId   = domExtensionItemTR.getAttribute("extensionId");
        const domExtensionName = domExtensionItemTR.getAttribute("extensionName");

        this.debug(`addButtonClicked -- Adding Extension -- domExtensionId="${domExtensionId}" domExtensionName="${domExtensionName}"`);
        const newExtensionProps = await this.fsbOptionsApi.addOrUpdateExtension(undefined, domExtensionId, domExtensionName, false);
        if (! newExtensionProps) {
          this.debug(`addButtonClicked -- FAILED TO ADD EXTENSION -- domExtensionId="${domExtensionId}" domExtensionName="${domExtensionName}"`);
        } else {
          this.debug(`addButtonClicked -- Extension Added -- newExtensionProps.id="${newExtensionProps.id}" newExtensionProps.name="${newExtensionProps.name}"`);
          count++;
        }
      }
    }
    const responseMessage = { 'ADDED': count };

    this.debug(`addButtonClicked -- Sending responseMessage="${responseMessage}"`);

    let errors = 0;
    try {
      await messenger.runtime.sendMessage(
        { ExtensionChooserResponse: responseMessage }
      );
    } catch (error) {
      this.caught( error, 
                   "addButtonClicked ##### SEND RESPONSE MESSAGE FAILED #####"
                   + `\n- responseMessage="${responseMessage}"`
                 );
      errors++;
      this.setErrorFor("fsbExtensionChooserPopupInstructions", "identityEditor_error_message_response_message_failed_ui");
    }

    if (errors) {
      // allow the user to see the message

    } else {
      this.debug("addButtonClicked -- No Errors - closing window");
      window.close();
    }

  }

  resetErrors() {
    let errorDivs = document.querySelectorAll("div.extension-data-error");
    if (errorDivs) {
      for (let errorDiv of errorDivs) {
        errorDiv.setAttribute("error", "false");
      }
    }

    let errorLabels = document.querySelectorAll("label.extension-data-error-text");
    if (errorLabels) {
      for (let errorLabel of errorLabels) {
        errorLabel.setAttribute("error", "false");
        errorLabel.innerText = ""; // MABXXX THIS IS A HUGE LESSON:  DO NOT USE: <label/>   USE: <label></label> 
      }
    }
  }

  setErrorFor(elementId, msgId) {
    if (elementId && msgId) {
      let errorDiv = document.querySelector("div.extension-data-error[error-for='" + elementId + "']");
      if (errorDiv) {
        errorDiv.setAttribute("error", "true");
      }

      let errorLabel = document.querySelector("label.extension-data-error-text[error-for='" + elementId + "']");
      if (errorLabel) {
        let i18nMessage = getI18nMsg(msgId);
        errorLabel.innerText = i18nMessage;
      }
    }
  }



  async cancelButtonClicked(e) {
    this.debug(`cancelButtonClicked -- e.target.tagName="${e.target.tagName}"`);

    this.canceled = true;

    // maybe not the best idea to do this... message receiver gets:
    //     Promise rejected after context unloaded: Actor 'Conduits' destroyed before query 'RuntimeMessage' was resolved
    let responseMessage = "CANCELED";
    this.debug(`cancelButtonClicked -- Sending responseMessage="${responseMessage}"`);

    try {
      await messenger.runtime.sendMessage(
        { IdentityEditorResponse: responseMessage }
      );
    } catch (error) {
      // any need to tell the user???
      this.caught( error,
                   "cancelButtonClicked ##### SEND RESPONSE MESSAGE FAILED #####"
                   + `\n- responseMessage="${responseMessage}"`
                 );
    }

    this.debug("cancelButtonClicked -- Closing window");
    window.close();
  }



//        this.debug(`run -- ADDING Installed Extension -- ext.id="${ext.id}" ext.name="${ext.name}"`);
//
//        const props = {
//          'id':          ext.id,
//          'name':        ext.name,
//          'allowAccess': false
//        };
//
//        addedExtensionsProps[ext.id] = props;
//        allExtensionsProps[ext.id] = props;
//    if (count) await this.fsbOptionsApi.storeExtensionsProps(allExtensionsProps);
}

const extensionChooser = new ExtensionChooser();

document.addEventListener("DOMContentLoaded", (e) => extensionChooser.run(e), {once: true});
