import { Logger     } from '../modules/logger.js';
import { FsbOptions } from '../modules/options.js';
import { getI18nMsg, parseDocumentLocation } from '../modules/utilities.js';

class ConfirmDialog {
  #windowName       = "confirmDialogWindow";                                // will be replaced by the "windowName" or the "wn" parameter in the URL

  #CLASS_NAME       = this.constructor.name;

  #INFO             = false;
  #LOG              = false;
  #DEBUG            = false;
  #WARN             = false;


  constructor() {
    this.logger     = new Logger();
    this.optionsApi = new FsbOptions(this.logger);                          // MABXXX REQUIRES MODIFICTION FOR EACH EXTENSION
  }



  info(...info) {
    if (this.#INFO) this.logger.info(this.#CLASS_NAME, ...info);
  }

  infoAlways(...info) {
    this.logger.infoAlways(this.#CLASS_NAME, ...info);
  }

  log(...info) {
    if (this.#LOG) this.logger.log(this.#CLASS_NAME, ...info);
  }

  logAlways(...info) {
    this.logger.logAlways(this.#CLASS_NAME, ...info);
  }

  debug(...info) {
    if (this.#DEBUG) this.logger.debug(this.#CLASS_NAME, ...info);
  }

  debugAlways(...info) {
    this.logger.debugAlways(this.#CLASS_NAME, ...info);
  }

  warn(...info) {
    if (this.#WARN) this.logger.warn(this.#CLASS_NAME, ...info);
  }

  warnAlways(...info) {
    this.logger.warnAlways(this.#CLASS_NAME, ...info);
  }

  error(...info) {
    // always log errors
    this.logger.error(this.#CLASS_NAME, ...info);
  }

  caught(e, ...info) {
    // always log exceptions
    this.logger.error( this.#CLASS_NAME,
                       msg,
                       "\n name:    " + e.name,
                       "\n message: " + e.message,
                       "\n stack:   " + e.stack,
                       ...info
                     );
  }



  async run(e) {
    window.addEventListener("beforeunload", (e) => this.windowUnloading(e));

    const thisWindow = await messenger.windows.getCurrent();
    messenger.windows.onRemoved.addListener((windowId) => this.windowRemoved(windowId, thisWindow.id));

    const okButtonLabelMsgId     = "fsbConfirmDialog_okButton.label";                     // MABXXX REQUIRES MODIFICTION FOR EACH EXTENSION can be replaced by param
    const cancelButtonLabelMsgId = "fsbConfirmDialog_cancelButton.label";                 // MABXXX REQUIRES MODIFICTION FOR EACH EXTENSION can be replaced by param
    const yesButtonLabelMsgId    = "fsbConfirmDialog_yesButton.label";                    // MABXXX REQUIRES MODIFICTION FOR EACH EXTENSION can be replaced by param
    const noButtonLabelMsgId     = "fsbConfirmDialog_noButton.label";                     // MABXXX REQUIRES MODIFICTION FOR EACH EXTENSION can be replaced by param

    var   title                  = getI18nMsg("fsbConfirmDialogTitle", "Please Confirm"); // MABXXX REQUIRES MODIFICTION FOR EACH EXTENSION can be replaced by "title" or "t" param
    var   titleBGColor           = undefined; // tb
    var   titleColor             = undefined; // tc
    var   titleFontWeight        = undefined; // tw
    var   titleFontSize          = undefined; // ts
    var   titleTextAlign         = undefined; // ta
    var   titleTextDecoration    = undefined; // ttd
    var   titleTextShadow        = undefined; // tts

    var   msgPanelBgColor        = undefined; // pb
    var   msgPanelBorder         = undefined; // pbd
    var   msgPanelBorderRadius   = undefined; // pbr
    var   msgPanelPadding        = undefined; // pp
    var   msgPanelTextAlign      = undefined; // pa

    var   msgCount               = 6;  // m - 6 for backward-compatibility for older users that don't pass a message count and are limited to 6 messages
    const msgTexts               = []; // mXX or messageXX
    const msgBGColors            = []; // mbXX
    const msgColors              = []; // mcXX
    const msgFontSizes           = []; // msXX
    const msgFontWeights         = []; // mwXX
    const msgTextAligns          = []; // maXX
    const msgTextDecorations     = []; // mtdXX
    const msgTextShadows         = []; // mtsXX

    var   ulCount                = 0;  // u
    const ulTexts                = []; // uXX
    const ulBGColors             = []; // ubXX
    const ulColors               = []; // ucXX
    const ulFontSizes            = []; // usXX
    const ulFontWeights          = []; // uwXX
    const ulTextAligns           = []; // uaXX
    const ulTextDecorations      = []; // utdXX
    const ulTextShadows          = []; // utsXX

    var   fmsgCount              = 0;  // f
    const fmsgTexts              = []; // fXX
    const fmsgBGColors           = []; // fbXX
    const fmsgColors             = []; // fcXX
    const fmsgFontSizes          = []; // fsXX
    const fmsgFontWeights        = []; // fwXX
    const fmsgTextAligns         = []; // fa[XX
    const fmsgTextDecorations    = []; // tdfXX
    const fmsgTextShadows        = []; // ftsXX

    var   buttonCount            = 2;  // b - 2 for backward-compatibility for older users that don't pass a button count and are limited to 3 buttons
    const buttonMsgIds           = []; // bmXX or buttonXXMsgId
    const buttonLabels           = []; // bXX  or buttonXX

    const docLocationInfo        = parseDocumentLocation(document);
    const params                 = docLocationInfo.params;

    if (params) {
      var param;

      param = params.get("windowName") // we could use just "wn" but older users use "windowName"
      if (param) this.#windowName = param;
      param = params.get("wn")
      if (param) this.#windowName = param;



      param = params.get('title'); // we could use just "t" but older users use "title"
      if (param) title = param;
      param = params.get('t');
      if (param) title = param;

      param = params.get('ta');
      if (param) titleTextAlign = param;

      param = params.get('tb');
      if (param) titleBGColor = param;

      param = params.get('tc');
      if (param) titleColor = param;

      param = params.get('ts');
      if (param) titleFontSize = param;

      param = params.get('ttd');
      if (param) titleTextDecoration = param;

      param = params.get('tts');
      if (param) titleTextShadow = param;

      param = params.get('tw');
      if (param) titleFontWeight = param;



      param = params.get('pb');
      if (param) msgPanelBgColor = param;

      param = params.get('pbd');
      if (param) msgPanelBorder = param;

      param = params.get('pbr');
      if (param) msgPanelBorderRadius = param;

      param = params.get('pp');
      if (param) msgPanelPadding = param;

      param = params.get('pa');
      if (param) msgPanelTextAlign = param;



      param = params.get('c'); // msgCount
      if (param) {
        const num = Number(param);
        if (Number.isInteger(num)) {
          msgCount = num;
        }
      }

      for (var i = 1; i <= msgCount; ++i) {
        param = params.get(`message${i}`); // we could use just "mXX" but older users use "messageXX"
        if (param) msgTexts[i] = param;
        param = params.get(`m${i}`);
        if (param) msgTexts[i] = param;

        param = params.get(`ma${i}`);
        if (param) msgTextAligns[i] = param;

        param = params.get(`mb${i}`);
        if (param) msgBGColors[i] = param;

        param = params.get(`mc${i}`);
        if (param) msgColors[i] = param;

        param = params.get(`ms${i}`);
        if (param) msgFontSizes[i] = param;

        param = params.get(`mtd{i}`);
        if (param) msgTextDecorations[i] = param;

        param = params.get(`mts{i}`);
        if (param) msgTextShadows[i] = param;

        param = params.get(`mw${i}`);
        if (param) msgFontWeights[i] = param;
      }



      param = params.get('u'); // ulCount
      if (param) {
        const num = Number(param);
        if (Number.isInteger(num)) {
          ulCount = num;
        }
      }

      for (var i = 1; i <= ulCount; ++i) {
        param = params.get(`u${i}`);
        if (param) ulTexts[i] = param;

        param = params.get(`ua${i}`);
        if (param) ulTextAligns[i] = param;

        param = params.get(`ub${i}`);
        if (param) ulBGColors[i] = param;

        param = params.get(`uc${i}`);
        if (param) ulColors[i] = param;

        param = params.get(`us${i}`);
        if (param) ulFontSizes[i] = param;

        param = params.get(`utd{i}`);
        if (param) ulTextDecorations[i] = param;

        param = params.get(`uts{i}`);
        if (param) ulTextShadows[i] = param;

        param = params.get(`uw${i}`);
        if (param) ulFontWeights[i] = param;
      }



      param = params.get('f'); // fmsgCount
      if (param) {
        const num = Number(param);
        if (Number.isInteger(num)) {
          fmsgCount = num;
        }
      }

      for (var i = 1; i <= fmsgCount; ++i) {
        param = params.get(`f${i}`);
        if (param) fmsgTexts[i] = param;

        param = params.get(`fa${i}`);
        if (param) fmsgTextAligns[i] = param;

        param = params.get(`fb${i}`);
        if (param) fmsgBGColors[i] = param;

        param = params.get(`fc${i}`);
        if (param) fmsgColors[i] = param;

        param = params.get(`fs${i}`);
        if (param) fmsgFontSizes[i] = param;

        param = params.get(`ftd{i}`);
        if (param) fmsgTextDecorations[i] = param;

        param = params.get(`fts{i}`);
        if (param) fmsgTextShadows[i] = param;

        param = params.get(`fw${i}`);
        if (param) fmsgFontWeights[i] = param;
      }



      param = params.get('yes_no');
      if (param && param === 'true') {
        buttonCount      = 2;
        buttonMsgIds[1]  = yesButtonLabelMsgId;
        buttonMsgIds[2]  = noButtonLabelMsgId;
      }

      param = params.get('yes_no_cancel');
      if (param && param === 'true') {
        buttonCount     = 3;
        buttonMsgIds[1] = yesButtonLabelMsgId;
        buttonMsgIds[2] = noButtonLabelMsgId;
        buttonMsgIds[3] = cancelButtonLabelMsgId;
      }

      param = params.get('buttons_3');
      if (param && param === 'true') {
        buttonCount = 3;
      }

      param = params.get('b');
      if (param) {
        const num = Number(param);
        if (Number.isInteger(num)) {
          buttonCount = num;
        }
      }

      // buttonX and buttonXMsgId override all presets

      for (var i = 1; i <= buttonCount; ++i) {
        param = params.get(`b${i}`);
        if (! param) param = params.get(`button${i}`);
        if (param) {
          buttonLabels[1] = param;
        } else {
          param = params.get(`bm${i}`);
          if (! param) param = params.get(`button${i}MsgId`);
          if (param) {
            buttonMsgIds[i] = param;
            buttonLabels[i] = getI18nMsg(buttonMsgIds[i], "BUTTON_1");
          }
        }
      }
    }

    this.debugAlways( "--"
                + `\n- title="${title}"`
                + `\n- msgCount="${msgCount}"`
                + `\n- msgTexts[1]="${msgTexts[1]}"`         // for backward-compatibility for older users that don't pass a message count and are limited to 6 messages
                + `\n- msgTexts[2]="${msgTexts[2]}"`         // for backward-compatibility for older users that don't pass a message count and are limited to 6 messages
                + `\n- msgTexts[3]="${msgTexts[3]}"`         // for backward-compatibility for older users that don't pass a message count and are limited to 6 messages
                + `\n- msgTexts[4]="${msgTexts[4]}"`         // for backward-compatibility for older users that don't pass a message count and are limited to 6 messages
                + `\n- msgTexts[5]="${msgTexts[5]}"`         // for backward-compatibility for older users that don't pass a message count and are limited to 6 messages
                + `\n- msgTexts[6]="${msgTexts[6]}"`         // for backward-compatibility for older users that don't pass a message count and are limited to 6 messages
                + `\n- buttonCount=${buttonCount}`
                + `\n- buttonLabels[1]="${buttonLabels[1]}"` // for backward-compatibility for older users that don't pass a button count and are limited to 3 buttons
                + `\n- buttonLabels[2]="${buttonLabels[2]}"`
                + `\n- buttonLabels[3]="${buttonLabels[3]}"`
              );


    const titleLabel = document.getElementById("ConfirmDialogTitleLabel");
    if (! titleLabel) {
      //
    } else {
      titleLabel.innerText = title;

      if (titleColor)          titleLabel.style.color          = titleColor;
      if (titleFontSize)       titleLabel.style.fontSize       = titleFontSize;
      if (titleFontWeight)     titleLabel.style.fontWeight     = titleFontWeight;
      if (titleTextAlign)      titleLabel.style.textAlign      = titleTextAlign;
      if (titleTextDecoration) titleLabel.style.textDecoration = titleTextDecoration;
      if (titleTextShadow)     titleLabel.style.textShadow     = titleTextShadow;
    }


    const messagesPanel = document.getElementById("ConfirmDialogMessagesPanel");

    if (! messagesPanel) {
      //
    } else {
      if (msgPanelBgColor)      messagesPanel.style.backgroundColor = msgPanelBgColor;
      if (msgPanelBorder)       messagesPanel.style.border          = msgPanelBorder;
      if (msgPanelBorderRadius) messagesPanel.style.borderRadius    = msgPanelBorderRadius;
      if (msgPanelPadding)      messagesPanel.style.padding         = msgPanelPadding;
      if (msgPanelTextAlign)    messagesPanel.style.textAlign       = msgPanelTextAlign;


      if (msgTexts.length < 1) {
        //
      } else {
        for (var i = 1; i <= msgCount; ++i) {
          const msgText        = msgTexts[i];
          const bgColor        = msgBGColors[i];
          const color          = msgColors[i];
          const fontSize       = msgFontSizes[i];
          const fontWeight     = msgFontWeights[i];
          const textAlign      = msgTextAligns[i];
          const textDecoration = msgTextDecorations[i];
          const textShadow     = msgTextShadows[i];

          if (msgText !== undefined) {
            const messageDiv = document.createElement('div');
              messageDiv.classList.add('confirm-dialog-message');

              if (bgColor)        messageDiv.style.backgroundColor = bgColor;
              if (color)          messageDiv.style.color           = color;
              if (fontSize)       messageDiv.style.fontSize        = fontSize;
              if (fontWeight)     messageDiv.style.fontWeight      = fontWeight;
              if (textAlign)      messageDiv.style.textAlign       = textAlign;
              if (textDecoration) messageDiv.style.textDecoration  = textDecoration;
              if (textShadow)     messageDiv.style.textShadow      = textShadow;

              const messageLabel = document.createElement('label');
                if (msgText === " ") messageLabel.innerHTML = "&nbsp;";
                else                 messageLabel.innerText = msgText;
              messageDiv.appendChild(messageLabel);
            messagesPanel.appendChild(messageDiv);
          }
        }

      }


      if (ulTexts.length < 1) {
        //
      } else {
        const ul = document.createElement('ul');

          for (var i = 1; i <= ulCount; ++i) {
            const text           = ulTexts[i];
            const bgColor        = ulBGColors[i];
            const color          = ulColors[i];
            const fontSize       = ulFontSizes[i];
            const fontWeight     = ulFontWeights[i];
            const textAlign      = ulTextAligns[i];
            const textDecoration = ulTextDecorations[i];
            const textShadow     = ulTextShadows[i];

            if (text !== undefined) {
              const li = document.createElement('li');
                if (textAlign)  li.style.textAlign = textAlign;

                const liSpan = document.createElement('span');
                  liSpan.classList.add('confirm-dialog-message');

                  if (bgColor)        liSpan.style.backgroundColor = bgColor;
                  if (color)          liSpan.style.color           = color;
                  if (fontSize)       liSpan.style.fontSize        = fontSize;
                  if (fontWeight)     liSpan.style.fontWeight      = fontWeight;
                  if (textDecoration) liSpan.style.textDecoration  = textDecoration;
                  if (textShadow)     liSpan.style.textShadow      = textShadow;

                  const liLabel = document.createElement('label');
                    if (text === " ") liLabel.innerHTML = "&nbsp;";
                    else              liLabel.innerText = text;
                  liSpan.appendChild(liLabel);
                li.appendChild(liSpan);
              ul.appendChild(li);
            }
          }

        messagesPanel.appendChild(ul);
      }


      if (fmsgTexts.length < 1) {
        //
      } else {
        for (var i = 1; i <= fmsgCount; ++i) {
          const msgText        = fmsgTexts[i];
          const bgColor        = fmsgBGColors[i];
          const color          = fmsgColors[i];
          const fontSize       = fmsgFontSizes[i];
          const fontWeight     = fmsgFontWeights[i];
          const textAlign      = fmsgTextAligns[i];
          const textDecoration = fmsgTextDecorations[i];
          const textShadow     = fmsgTextShadows[i];

          if (msgText !== undefined) {
            const messageDiv = document.createElement('div');
              messageDiv.classList.add('confirm-dialog-message');

              if (bgColor)        messageDiv.style.backgroundColor = bgColor;
              if (color)          messageDiv.style.color           = color;
              if (fontSize)       messageDiv.style.fontSize        = fontSize;
              if (fontWeight)     messageDiv.style.fontWeight      = fontWeight;
              if (textAlign)      messageDiv.style.textAlign       = textAlign;
              if (textDecoration) messageDiv.style.textDecoration  = textDecoration;
              if (textShadow)     messageDiv.style.textShadow      = textShadow;

              const messageLabel = document.createElement('label');
                if (msgText === " ") messageLabel.innerHTML = "&nbsp;";
                else                 messageLabel.innerText = msgText;
              messageDiv.appendChild(messageLabel);
            messagesPanel.appendChild(messageDiv);
          }
        }
      } 
    } 



    const buttonPanel = document.getElementById("ConfirmDialogButtonPanel");

    if (! buttonPanel) {
      //
    } else if (buttonCount < 1) {
      //
    } else {
      for (var i = 1; i <= buttonCount; ++i) {
        const buttonLabel = buttonLabels[i];

        if (buttonLabel) {
          const button = document.createElement('button');
            button.setAttribute( "id",        `ConfirmDialogButton${i}` );
            button.setAttribute( "butttonId", `BUTTON_${i}`             );
            button.setAttribute( "data",      `BUTTON_${i}`             );
            button.classList.add( "confirm-dialog-button" );
            button.classList.add( "no-css"                );
            button.addEventListener( "click", (e) => this.buttonClicked(e) );

            const label = document.createElement('label');
              label.setAttribute( "id",  `ConfirmDialogButton${i}Label` );
              label.setAttribute( "for", `ConfirmDialogButton${i}`      );
              label.textContent = buttonLabel;
            button.appendChild(label);
          buttonPanel.appendChild(button);
        }
      }
    }

    await this.localizePage();
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



  async windowUnloading(e) {
    if (this.#DEBUG) this.debugAlways( "--- Window Unloading ---"
                                      + `\n- window.screenTop=${window.screenTop}`
                                      + `\n- window.screenLeft=${window.screenLeft}`
                                      + `\n- window.outerWidth=${window.outerWidth}`
                                      + `\n- window.outerHeight=${window.outerHeight}`
                                    );

    await this.optionsApi.storeWindowBounds(this.#windowName, window);

    if (this.#DEBUG) {
      const bounds = await this.optionsApi.getWindowBounds(this.#windowName);

      if (! bounds) {
        this.debugAlways(`--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- FAILED TO GET Window Bounds "${this.#windowName}" ---`);
      } else if (typeof bounds !== 'object') {
        this.debugAlways(`--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- Window Bounds "${this.#windowName}" IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
      } else {
        this.debugAlways( `--- Retrieve Stored Window Bounds "${this.#windowName}" ---`
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



  async windowRemoved(windowId, thisWindowId) {
    this.debug(`-- windowId="${windowId}" thisWindowId="${thisWindowId}" `);


    if (true) { // <==========================================================================================<<<
      // sending the message causes the "'Conduits' destroyed" error mentioned below.
      // they'll just have to listen for the onRemoved() event.
    } else {
      const responseMessage = "CLOSED";
      this.debug(`-- Sending responseMessage="${responseMessage}"`);

      try { // just in case the window is not listening for windowRemoved (any more)
        // maybe not the best idea to do this... message receiver gets:
        //     Promise rejected after context unloaded: Actor 'Conduits' destroyed before query 'RuntimeMessage' was resolved
        await messenger.runtime.sendMessage(
          { ConfirmDialogResponse: responseMessage }
        );
      } catch (error) {
        // any need to tell the user???
        this.caught( error,
                     "##### SEND RESPONSE MESSAGE FAILED #####"
                     + `\n- windowId="${windowId}"`
                     + `\n- thisWindowId="${thisWindowId}"`
                     + `\n- responseMessage="${responseMessage}"`
                   );
      }
    }
  }




  async buttonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}" e.target.id="${e.target.id}"`);

    e.preventDefault();

    var target = e.target;
    if (target.tagName === 'LABEL' && target.parentElement && target.parentElement.tagName === 'BUTTON') {
      target = target.parentElement;
    }
    this.debug(`-- target.tagName="${target.tagName}" target.id="${target.id}" button-id="${target.getAttribute('button-id')}"`);

      // it's up to the caller what the button-id -- 'BUTTON_1', 'BUTTON_2', or 'BUTTON_3' -- means, but all of them close the dialog
    var responseMessage = target.getAttribute('button-id');
    this.debug(`-- Sending responseMessage="${responseMessage}"`);

    try {
      await messenger.runtime.sendMessage(
        { 'ConfirmDialogResponse': responseMessage }
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



const confirmDialog = new ConfirmDialog();

document.addEventListener("DOMContentLoaded", (e) => confirmDialog.run(e), {once: true});
