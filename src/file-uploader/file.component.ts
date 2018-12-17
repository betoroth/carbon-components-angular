
import {
	Component,
	Input,
	Output,
	ViewChild,
	EventEmitter,
	OnInit,
	HostBinding
} from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";

import { I18n } from "../i18n/i18n.module";
import { FileItem } from "./file-uploader.interface";

@Component({
	selector: "ibm-file",
	template: `
		<p class="bx--file-filename">{{content.file.name}}</p>
		<span *ngIf="content.state === 'edit'" class="bx--file__state-container" (click)="removeFile(content)">
			<svg class="bx--file-close" fill-rule="evenodd" role="img" width="16" height="16" viewBox="0 0 16 16" tabindex="0"
				[attr.aria-label]="translations.CLOSE_BUTTON" [attr.alt]="translations.CLOSE_BUTTON">
				<title>{{translations.CLOSE_TITLE}}</title>
				<path d="M8 6.586L5.879 4.464 4.464 5.88 6.586 8l-2.122 2.121 1.415 1.415L8 9.414l2.121 2.122 1.415-1.415L9.414
				8l2.122-2.121-1.415-1.415L8 6.586zM8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16z"></path>
			</svg>
		</span>
		<span *ngIf="content.state === 'upload'">
			<ibm-loading size="sm"></ibm-loading>
		</span>
		<span *ngIf="content.state === 'complete'" class="bx--file__state-container">
			<svg class="bx--file-complete" fill-rule="evenodd" role="img" width="16" height="16" viewBox="0 0 16 16" tabindex="0"
				[attr.aria-label]="translations.CHECKMARK" [attr.alt]="translations.CHECKMARK">
				<title>{{translations.CHECKMARK_TITLE}}</title>
				<path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm3.293-11.332L6.75 9.21 4.707 7.168 3.293 8.582 6.75
				12.04l5.957-5.957-1.414-1.414z"></path>
			</svg>
		</span>
	`
})
export class File {
	/**
	 * Accessible translations for the close and complete icons
	 */
	@Input() translations = this.i18n.get().FILE_UPLOADER;
	/**
	 * A single FileItem from the set of FileItems
	 */
	@Input() content: FileItem;
	/**
	 * Maintains a reference to the view DOM element of the underlying <input> node
	 */
	@Input() file;
	/**
	 * The list of files that have been submitted to be uploaded
	 */
	@Input() files: Set<FileItem>;
	@Input() filesChange;

	@HostBinding("class.bx--file__selected-file") selectedFile = true;

	constructor(protected i18n: I18n) {}

	removeFile(file) {
		this.files.delete(file);
		this.file.value = "";
		this.filesChange.emit(this.files);
	}
}
