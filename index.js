const HEADER_CLASS      = "header",
      PARAGRAPH_CLASS   = "section-content",
      FOOTNOTE_CLASS    = "footnote",
      HELP_TEXT_CLASS   = "help-text",
      BOOK_CONTAINER    = ".book-container",
      BOOK_CONTENT_TEMP = ".book-content-temp",
      BOOK_CONTENT      = ".book-content",
      BOOK_PREVIEW      = ".book-preview",
      BOOK_SECTIONS     = ".book-sections",
      BOOK_NEXT_BTN     = "#book-control-next",
      BOOK_PREV_BTN     = "#book-control-prev",
      PAGEDJS_PAGE      = ".pagedjs_page",
      LOADER            = ".loader",
      TEXT_CONTROLS     = ".text-controls-container"
      FONT_SIZE_UNIT    = "pt";

class Customizations {
  constructor(id, customizations) {
    if (!id) {
      return;
    }
    
    this.customizations = {
      id,
      fontSize: 11,
      headerFontSize: 16,
      bold: false,
      color: "#000",
      alignment: "justify",
      showFootnotes: false,
    };
    
    if (customizations) {
      Object.keys(customizations).map(key => this.customizations[key] = customizations[key])
    }
  }
  
  getFontSize() { return this.customizations['fontSize'] };
  setFontSize(value) {
    this.customizations['fontSize'] = value;
  }
  
  getHeaderFontSize() { return this.customizations['setHeaderFontSize'] };
  setHeaderFontSize(value) {
    this.customizations['setHeaderFontSize'] = value;
  }
  
  getColor() { return this.customizations['color'] };
  setColor(value) {
    this.customizations['color'] = value;
  }
  
  getAlignment() { return this.customizations['alignment'] };
  setAlignment(value) {
    this.customizations['alignment'] = value;
  }
  
  getShowFootnotes() { return this.customizations['showFootnotes'] };
  setShowFootnotes(value) {
    this.customizations['showFootnotes'] = value;
  }
}

class Section {
  constructor(valuesObject) {
    this.id    = valuesObject.id;    // int
    this.label = valuesObject.label; // string
    this.texts = valuesObject.texts; // int[]
  }

  get(property) { return this[property] }
  set(property, value) { return this[property] !== undefined ? this[property] = value : null; }
}

class Footnote {
  constructor(valuesObject) {
    this.id    = valuesObject.id;    // int
    this.label = valuesObject.label; // string
    this.text  = valuesObject.text;  // string
  }

  get(property) { return this[property]; }
  set(property, value) { return this[property] !== undefined ? this[property] = value : null; }
}

class Text {
  constructor(valuesObject) {
    this.id         = valuesObject.id;         // int
    this.label      = valuesObject.label;      // string
    this.text       = valuesObject.text;       // string
    this.english    = valuesObject.english;    // string
    this.attributes = valuesObject.attributes; // string[]
    this.footnotes  = valuesObject.footnotes ; // int[]
  }

  get(property) { return this[property] }
  set(property, value) { return this[property] !== undefined ? this[property] = value : null; }
}

class Book {
  constructor(schema) {
    this.db         = new TextsDB(db);
    this.schema     = schema || {};
    this.pageCount  = this.schema.pageCount || 1;
    this.sections   = this.schema.sections || [];
    this.rawHtml    = this.schema.rawHtml || "";
    this.texts      = this.schema.texts || [];
    this.footnotes  = this.schema.footnotes || [];
    this.maxWords   = this.schema.maxWords || 100;
    this.pageWidth  = this.schema.pageWidth || 672;
    this.pageHeight = this.schema.pageHeight || 960;
    this.fontSize   = this.schema.fontSize || 12;
    this.activePage = this.schema.activePage || 1;
    this.customizations = this.schema.customizations || {};
  }
  
  addSection(sectionId) {
    const sectionData = this.db.getSectionTexts(sectionId);
    for (let text of sectionData.texts) {
      if (text.footnotes) { 
        let rawFootnoteText = [];
        for (let footnote of text.footnotes) {
          const footnoteObj = this.db.getFootnote(footnote);
          if (footnoteObj) {
            rawFootnoteText.push(footnoteObj);
          }
        }
        text.footnotes = rawFootnoteText;
      }
    }
    this.sections.push({
      ...sectionData,
      customizations: new Customizations(),
      length: sectionData.texts.length,
    })
    
    // sectionData.texts.map(function(text) { 
    //   this.texts.push(text)
    //   this.rawHtml += <TextBlock text={text.text} id={text.id} />;
    // }.bind(this));
  }

  wrapContent() {
    $(BOOK_CONTENT_TEMP).wrap("<template data-ref='pagedjs-content'></template>");
    const body = document.querySelector("body");
    const template = body.querySelector(":scope > template[data-ref='pagedjs-content']");
    return template.content;
  }
  
  calculatePages() {
    //const content = this.wrapContent()
    //console.log(content)
    window.PagedPolyfill.preview($(BOOK_CONTENT)[0].innerHTML, ['./style.css'], $(BOOK_PREVIEW)[0]); 
    //window.PagedPolyfill.preview()
  }

  recalculatePage(pageNumber) {
    const page = $(`".pagedjs_page[data-page-number="${pageNumber}"]`);
    const content = page[0].innerHTML;
    window.PagedPolyfill.preview(content, ['./style.css'], page); 
  }

  addFootnoteToContent(paragraphId, footnoteData) {
    const contentNode = $(BOOK_CONTENT + ' p[data-paragraph-id="' + paragraphId + '"]')[0];
    const pageNode = $(BOOK_PREVIEW + ' p[data-paragraph-id="' + paragraphId + '"]')[0];
    console.log(contentNode, contentNode.childNodes[0])
    contentNode.innerHTML = contentNode.childNodes[0].nodeValue.replace(footnoteData.sourceText, `${footnoteData.sourceText} <span data-footnote-id="${footnoteData.id}" class='footnote'>${footnoteData.text}</span>`);
    pageNode.innerHTML = pageNode.childNodes[0].nodeValue.replace(footnoteData.sourceText, `${footnoteData.sourceText} <span data-footnote-id="${footnoteData.id}" class='footnote'>${footnoteData.text}</span>`);
  }

  navPage(direction) {
    if (direction === 1) {
      if (this.activePage < this.pageCount) {
        this.activePage = this.activePage + 2;
      }
    }
    else {
      if (this.activePage > 1) {
        this.activePage = this.activePage - 2;
      }
    }

    this.setActiveDomPage()
  }

  setActiveDomPage() {
    $(PAGEDJS_PAGE).removeClass("active");
    $(PAGEDJS_PAGE + `[data-page-number="${this.activePage}"]`).addClass("active")
    $(PAGEDJS_PAGE + `[data-page-number="${this.activePage + 1}"]`).addClass("active")
  }

  addCustomization(id, customizations) {
    const newCustomization = new Customizations(id, customizations);
    this.customizations[id] = newCustomization;
  }

  getActivePage() { return this.activePage; }
  setActivePage(val) { return this.activePage = val; }
  getPageCount() { return this.pageCount; }
  setPageCount(val) { this.pageCount = val; }
  getHtml() { return this.rawHtml; }
  getSections() { return this.sections; }
  getTexts() { return this.texts; }
  getFootnotes () { return this.footnotes; }
  getPageWidth() { return this.pageWidth }
  getPageHeight() { return this.pageHeight }
  getFontSize() { return this.fontSize }
  getCustomization(id) { return this.customizations[id]; }
  getCustomizations() { return this.customizations; }
  removeCustomization(id) { delete this.customizations[id]; }
}

class TextsDB {
  constructor(db) { 
    this.db = db;
  }
  
  getSectionTexts(sectionId) {
    const section = this.getSection(sectionId);
    if (!section)
      return { section: null, texts: null };
    else {
      let texts = [];
      section.get('texts').map(textId => {
        texts.push(this.getText(textId))
      })
      return {
        section,
        texts,
      };
    }
  }
  
  getSection(sectionId) {
    const row = this.db.sections.filter(section => section.id === sectionId)[0];
    if (row)
      return new Section(JSON.parse(JSON.stringify(row)));
    else
      return null
  }
  
  getText(textId) {
    const row = this.db.texts.filter(text => text.id === textId)[0];
    if (row)
      return new Text(JSON.parse(JSON.stringify(row)));
    else {
      return null;
    }
  }
    
  getFootnote(footnoteId) {
    const row = this.db.footnotes.filter(footnote => footnote.id === footnoteId)[0];
    if (row)
      return new Footnote(JSON.parse(JSON.stringify(row)));
    else {
      return null;
    }
  }
}

class Events {
  constructor(book) {
    this.book = book;

    this.pageCountEvent = new CustomEvent('pageCount', { pageCount: () => this.book.getPageCount() })
    this.pageNavEvent   = new CustomEvent('pageNav',   { page: () => this.book.getActivePage() })
  }

  addSubscriber(element, eventsArray, callback) {
    eventsArray.map(event => {
      (element || window).addEventListener(event, function(e) { callback(e) })
    })
  }

  triggerPageNavEvent(element) {
    (element || window).dispatchEvent(this.pageNavEvent)
  }

  triggerPageCountEvent(element) {
    (element || window).dispatchEvent(this.pageCountEvent)
  }
}

class BookControls {
  constructor(book, events, prevBtnElement, nextBtnElement) {
    this.book = book;
    this.events = events;
    this.prevBtnElement = prevBtnElement;
    this.nextBtnElement = nextBtnElement;

    this.prevBtnElement.on('pageCount', (event) => console.log(event))
    this.events.addSubscriber(null, ['pageCount', 'pageNav'], (event) => this.conditionallyDisableNav(event))
    this.conditionallyDisableNav()
    this.initBindings()
  }

  conditionallyDisableNav(pageNavEvent) {
    if (this.book.getPageCount() <= 1) {
      this.prevBtnElement.attr("disabled", true);
      this.nextBtnElement.attr("disabled", true);
    }
    else {
      if (pageNavEvent) {
        if (this.book.getActivePage() === 1) {
          this.prevBtnElement.attr("disabled", true);
          this.nextBtnElement.attr("disabled", false);
        }
        else if (this.book.getActivePage() === this.book.getPageCount()) {
          this.nextBtnElement.attr("disabled", true);
          this.prevBtnElement.attr("disabled", false);
        }
        else {
          this.nextBtnElement.attr("disabled", false);
          this.prevBtnElement.attr("disabled", false);
        }
      }
    }
  }

  nextClick() {
    this.book.navPage(1);
    console.log(this.book.getActivePage())
    this.events.triggerPageNavEvent()
  }

  prevClick() {
    this.book.navPage(-1);
    console.log(this.book.getActivePage())
    this.events.triggerPageNavEvent()
  }

  initBindings() {
    this.prevBtnElement.on('click', this.prevClick.bind(this))
    this.nextBtnElement.on('click', this.nextClick.bind(this))
  }
}

const book = new Book();
const events = new Events(book);
const bookControls = new BookControls(book, events, $(BOOK_PREV_BTN), $(BOOK_NEXT_BTN));

function toggleLoader(display) {
  if (display) {
    $(LOADER).fadeIn(300);
  }
  else {
    $(LOADER).fadeOut(300);
  }
}

function addInitialSections(sectionsArray) {
  sectionsArray.map(section => book.addSection(section)) 
}

function loadInText() {
  toggleLoader(true)
  const sections = book.getSections();

  sections.map((section, index) => {
    addHeader((index + "_" + section.section.id), section.section.id, section.section.label)
    book.addCustomization(section.section.id)
    section.texts.map(text => {
      addContentText(section.section.id, text.id, text.text, text.footnotes)
    })
  })
}

function addHeader(sectionId, headerId, headerText) {
  $(BOOK_CONTENT).append(`<h3 data-section-id="${sectionId}" data-text-id="${headerId}">${headerText}</h3>`)
}

function addContentText(sectionId, textId, text, footnotes) {
  //const splitText = text.split(" ");
  //splitText.map((word, index) => $(BOOK_CONTENT_TEMP).append(`<word data-section-id="${sectionId}" data-word-id="${sectionId}_${index}" data-text-id="${textId}">${word} </word>`))
  const splitParagraphs = text.split(/\r?\n/);
  splitParagraphs.map((paragraph, index) => {

    book.addCustomization(`${index}_${textId}`)
    $(BOOK_CONTENT).append(`
      <p 
        data-section-id="${sectionId}" 
        data-text-id="${textId}" 
        data-paragraph-id="${index}_${textId}"
        ${ footnotes ? 'data-section-footnotes="' + JSON.stringify(footnotes).replace(/"/g, "&quot;") + '"' : ''}
      >${paragraph} 
      </p>
    `)
  })
  //$(BOOK_CONTENT_TEMP).append(`<p data-section-id="${sectionId}" data-text-id="${textId}">${text} </p>`)
}

function bindParagraphTags() {
  console.log('binding', $(BOOK_PREVIEW + " p"))
  $(BOOK_PREVIEW + " p").on("click", function() {
    toggleParagraphControls($(this))
  })
}

function getParagraphCustomizations(paragraphId) {
  return book.getCustomization(paragraphId);
}

function handleParagraphCustomizations(paragraphId, customizations) {
  $("#book-control-font-size").val(customizations.getFontSize())
}

function toggleParagraphControls(paragraph) {
  const rect = $(paragraph)[0].getBoundingClientRect();
  const id   = $(paragraph).attr("data-paragraph-id");
  const footnotes = $(paragraph).attr("data-section-footnotes");

  $(TEXT_CONTROLS).css({
    display: 'block',
    left: (rect.x + rect.width - $(TEXT_CONTROLS).width()) + 'px',
    top: (rect.y - $(TEXT_CONTROLS).height()) + 'px'
  });

  handleParagraphCustomizations(id, getParagraphCustomizations(id))

  if (footnotes) {
    $("#book-control-footnotes").attr("disabled", false)
    $("#book-control-footnotes").click(function() { 
      console.log(footnotes)
      toggleFootnotes(id, JSON.parse(footnotes.replace(/&quot;/g, '"'))) 
    })
  }
  else {
    $("#book-control-footnotes").off('click');
    $("#book-control-footnotes").attr("disabled", true)
  }
}

function toggleFootnotes(paragraphId, footnotes) {
  for (let footnote of footnotes) {
    book.addFootnoteToContent(paragraphId, footnote)
  }
}

function updateFontSize(paragraphId) {

}

function toggleBold(paragraphId) {

}

class MyHandler extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  // // Previewer
  afterPreview(pages) {
    console.log("afterPreview", pages)
    book.setPageCount(pages.length)
    events.triggerPageCountEvent()
    book.setActiveDomPage()
    bindParagraphTags()
    toggleLoader(false)
    console.log('end: ', Date.now())
  }

  // // Chunker
  beforeParsed(content) {
    //console.log("beforeParsed", content)
    console.log("start: ", Date.now())
  }
  // filter(content) {
  //   console.log("filter", content)
  // }
  // afterParsed(parsed) {
  //   console.log("afterParsed", parsed)
  // }
  // beforePageLayout(page) {
  //   console.log("beforePageLayout", page)
  // }
  // afterPageLayout(pageElement, page, breakToken) {
  //   console.log("afterPageLayout", pageElement, page, breakToken)
  // }
  // afterRendered(pages) {

  // }

  // Polisher
  // beforeTreeParse(text, sheet) {
  //   console.log("beforeTreeParse", text, sheet)
  // }
  // beforeTreeWalk(ast) {
  //   console.log("beforeTreeWalk", ast)
  // }
  // afterTreeWalk(ast, sheet) {
  //   console.log("afterTreeWalk", ast, sheet)
  // }
  // onUrl(urlNode) {
  //   console.log("onUrl", urlNode)
  // }
  // onAtPage(atPageNode) {
  //   console.log("onAtPage", atPageNode)
  // }
  // onRule(ruleNode) {
  //   console.log("onRule", ruleNode)
  // }
  // onDeclaration(declarationNode, ruleNode) {
  //   console.log("onDeclaration", declarationNode, ruleNode)
  // }
  // onContent(contentNode, declarationNode, ruleNode) {
  //   console.log("onContent", contentNode, declarationNode, ruleNode)
  // }

  // // Layout
  layoutNode(node) {
    if (!$(node).parents(BOOK_CONTENT_TEMP).length)
      return false;
  }
  // renderNode(node, sourceNode, layout) {
  //   console.log("renderNode", node, sourceNode, layout)
  // }
  // onOverflow(overflow, rendered, bounds) {
  //   console.log("onOverflow", overflow, rendered, bounds)
  // }
  // onBreakToken(breakToken, overflow, rendered) {
  //   console.log("onBreakToken", breakToken, overflow, rendered)
  // }
}

function registerPagedHandlers() {
  Paged.registerHandlers(MyHandler);
}

function init() {
  registerPagedHandlers()
  addInitialSections([0])
  loadInText()
  book.calculatePages()
}

init()