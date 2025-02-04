import {
	Component,
	Input,
	Optional,
	Output,
	EventEmitter
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { I18n } from "../../i18n/i18n.module";

/**
 * A fixed header and navigation.
 * Header may contain a Hamburger menu to toggle the side navigation, navigation actions,
 * and global actions (generally in the form of `Panel`s).
 *
 * [See demo](../../?path=/story/ui-shell--header)
 *
 * <example-url>../../iframe.html?id=ui-shell--header</example-url>
 */
@Component({
	selector: "ibm-header",
	template: `
		<header
			class="bx--header"
			role="banner"
			[attr.aria-label]="brand + ' ' + name">
			<a
				*ngIf="!skipTo"
				class="bx--skip-to-content"
				[href]="skipTo"
				tabindex="0">
				{{ i18n.get("UI_SHELL.SKIP_TO") | async }}
			</a>
			<ng-content select="ibm-hamburger"></ng-content>
			<a
				class="bx--header__name"
				href="#"
				(click)="navigate($event)">
				<span class="bx--header__name--prefix">{{brand}}&nbsp;</span>
				{{name}}
			</a>
			<ng-content></ng-content>
		</header>
	`
})
export class Header {
	/**
	 * ID in the main body content to jump to. Used by keyboard and screen reader users to skip the header content.
	 */
	@Input() skipTo: string;
	/**
	 * Label that shows to the right of the `brand` text. Generally a product name.
	 */
	@Input() name: string;
	/**
	 * Top level branding. Defaults to "IBM"
	 */
	@Input() brand = "IBM";

	/**
	 * Optional link for the header
	 */
	@Input() set href(v: string) {
		this._href = v;
	}

	get href() {
		return this.domSanitizer.bypassSecurityTrustUrl(this._href) as string;
	}

	/**
	 * Array of commands to send to the router when the link is activated
	 * See: https://angular.io/api/router/Router#navigate
	 */
	@Input() route: any[];

	/**
	 * Router options. Used in conjunction with `route`
	 * See: https://angular.io/api/router/Router#navigate
	 */
	@Input() routeExtras: any;

	/**
	 * Emits the navigation status promise when the link is activated
	 */
	@Output() navigation = new EventEmitter<Promise<boolean>>();

	protected _href = "javascript:void(0)";

	constructor(
		public i18n: I18n,
		protected domSanitizer: DomSanitizer,
		@Optional() protected router: Router) { }

	navigate(event) {
		if (this.router && this.route) {
			event.preventDefault();
			const status = this.router.navigate(this.route, this.routeExtras);
			this.navigation.emit(status);
		}
	}
}
