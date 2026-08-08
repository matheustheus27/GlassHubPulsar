class LayoutBlock {
    constructor({
        type,
        title = "",
        html = "",
        estimatedHeight = 0,
        repeatSectionTitle = false
    }) {
        this.type = type;
        this.title = title;
        this.html = html;
        this.estimatedHeight = estimatedHeight;
        this.repeatSectionTitle = repeatSectionTitle;
    }

    get height() {
        return this.estimatedHeight;
    }

    clone() {
        return new LayoutBlock({
            type: this.type,
            title: this.title,
            html: this.html,
            estimatedHeight: this.estimatedHeight,
            repeatSectionTitle: this.repeatSectionTitle
        });
    }

    static experience(itemHtml, height) {
        return new LayoutBlock({
            type: "experience",
            html: itemHtml,
            estimatedHeight: height,
            repeatSectionTitle: true
        });
    }

    static education(itemHtml, height) {
        return new LayoutBlock({
            type: "education",
            html: itemHtml,
            estimatedHeight: height,
            repeatSectionTitle: true
        });
    }

    static projects(itemHtml, height) {
        return new LayoutBlock({
            type: "projects",
            html: itemHtml,
            estimatedHeight: height,
            repeatSectionTitle: true
        });
    }

    static cover(itemHtml, height) {
        return new LayoutBlock({
            type: "cover",
            html: itemHtml,
            estimatedHeight: height,
            repeatSectionTitle: true
        });
    }

    static summary(html, height) {
        return new LayoutBlock({
            type: "summary",
            html,
            estimatedHeight: height
        });
    }

    static skills(html, height) {
        return new LayoutBlock({
            type: "skills",
            html,
            estimatedHeight: height
        });
    }
}

module.exports = LayoutBlock;