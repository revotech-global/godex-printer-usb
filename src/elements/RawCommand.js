/*jshint esversion: 6 */
/*
RawCommand.js
=============
Emits an arbitrary EZPL command string into the label command stream.

Use this when you need to inject mode-switching or other commands that
aren't expressible through the normal element classes — for instance,
flipping the label into inverse (`^LI`) for a section of drawing and
back out (`^L`) afterwards.
*/
import Element from './Element';

export default class RawCommand extends Element {

   constructor(command) {
      super();
      this.command = command;
   }

   getPrintCommand(dpi = 203) {
      super.getPrintCommand(dpi);
      // Ensure exactly one trailing newline so the printer's command parser
      // sees a clean break between this command and the next element.
      return this.command.endsWith('\n') ? this.command : `${this.command}\n`;
   }
}
