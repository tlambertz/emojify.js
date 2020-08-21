declare type Replacer = (emoji: string, name: string) => HTMLElement;
interface Window {
    NodeFilter: typeof NodeFilter;
    document: typeof document;
}
declare const modeToElementTag: {
    img: string;
    sprite: string;
    'data-uri': string;
};
declare type EmojifyConfig = {
    blacklist?: {
        ids: string[];
        classes: string[];
        elements: string[];
    };
    tag_type?: null;
    only_crawl_id?: null;
    img_dir?: string;
    ignore_emoticons?: boolean;
    mode?: keyof typeof modeToElementTag;
};
declare class Emojify {
    emojiMegaRe?: RegExp;
    defaultConfig: EmojifyConfig;
    config: EmojifyConfig;
    Validator: any;
    constructor();
    readonly emoticonsProcessed: [RegExp, string][];
    initMegaRe(): RegExp;
    getEmojiNameForMatch: (match: RegExpMatchArray) => string | undefined;
    emojifyString: (htmlString: string, replacer: Function) => string;
    defaultReplacer(emoji: string, name: string): string;
    insertEmojicon(args: {
        node: Text;
        match: RegExpMatchArray;
        emojiName: string;
        replacer: Replacer;
        win: Window;
    }): void;
    run: (el: Node | null, replacer: Replacer) => void;
    setConfig(newConfig: any): void;
}
export declare const emojify: Emojify;
export declare const defaultConfig: EmojifyConfig;
export declare const emojiNames: string[];
export declare const setConfig: (newConfig: any) => void;
export declare const replace: (htmlString: string, replacer: Function) => string;
export declare const run: (el: Node | null, replacer: Replacer) => void;
export {};
