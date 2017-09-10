/// <reference types="cli-color" />
import * as clc from 'cli-color';
import { LogEntry } from './AnsiLogger';
export declare type ColorMap = {
    [mask: number]: clc.Format;
} & {
    TIME: clc.Format;
} & {
    TITLE: clc.Format;
};
export interface TextTransformerOptionsInput {
    colorMap: {
        [color: string]: clc.Format;
    };
    colors: boolean;
    groupColor: clc.Format;
}
export interface TextTransformerOptions {
    colorMap?: TextTransformerOptionsInput['colorMap'];
    colors: TextTransformerOptionsInput['colors'];
    groupColor?: clc.Format;
}
export declare class TextTransformer {
    readonly options: Partial<TextTransformerOptions>;
    private _options;
    /**
     * Default color scheme
     * can be overriden by providing a
     * new full or partial ColorMap.
     */
    readonly colors: ColorMap;
    constructor(options?: Partial<TextTransformerOptionsInput>);
    /**
     * Colorize the message string.
     * NB! If no-colors mode is on or no color is given.
     * then this method just return the message as it is.
     */
    private colorize(msg, color?);
    /**
     * Format group if any.
     */
    private formatGroup(group);
    /**
     * Format the loglevel to the console
     */
    private formatLogLevel(loglevel);
    /**
     * Format a object to string.
     */
    private formatTime(time);
    private handleMultiline(msg, color?);
    /**
     * Resolves custom loglevel string
     */
    /**
     *
     * @param level
     */
    private resolveLevelColor(level);
    /**
     * Setting a single color in the `ColorMap`
     */
    private setColor(level, color);
    private setOptions(options);
    /**
     * Transform log entry to text output.
     */
    format(entry: LogEntry): string;
    /**
     * Set new colors.
     */
    setColors(colorMap: {
        [level: string]: clc.Format;
    }): void;
}
