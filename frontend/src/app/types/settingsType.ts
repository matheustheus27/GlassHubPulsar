export type LanguageCode = 'pt-BR' | 'en-US';

export type FontStyle = {
    fontType?: string;
    fontSize?: string;
    fontColor?: string;
    fontWeight?: string;
};

export type Settings = {
    language: LanguageCode;
    theme: 'light' | 'dark';
    template?: string;
    activeTemplate?: string;
    card: {
        borderColor: string;
        backgroundColor: string;
    };
    title: {
        primary: FontStyle;
        secondary: FontStyle;
    };
    subtitle: {
        primary: FontStyle;
        secondary: FontStyle;
    };
    caption: {
        primary: FontStyle;
        secondary: FontStyle;
    };
    meta: FontStyle;
    chip: FontStyle & {
        backgroundColor: string;
        borderColor: string;
    };
    cover: {
        common: FontStyle;
        signature: FontStyle;
    };
    backgroundColor?: string;
};