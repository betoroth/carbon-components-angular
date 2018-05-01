import {
	Component,
	Input,
	Output,
	EventEmitter,
	forwardRef,
	TemplateRef,
	AfterViewInit,
	ViewChild,
	ElementRef,
	OnDestroy,
	OnChanges
} from "@angular/core";

import { findNextElem, findPrevElem } from "./../../common/a11y.service";
import { AbstractDropdownView } from "./../abstract-dropdown-view.class";
import { ListItem } from "./../list-item.interface";
import { ListGroup } from "./../../list-group/list-group.component";
import { watchFocusJump } from "./../dropdowntools";
import { DropdownList } from "./dropdown-list.component";
import { dropdownConfig } from "../dropdown.const";


/**
 * ```html
 * <n-dropdown-filter [items]="listItems"></n-dropdown-filter>
 * ```
 *
 * @export
 * @class DropdownFilter
 * @extends {DropdownList}
 * @implements {AbstractDropdownView}
 * @implements {AfterViewInit}
 * @implements {OnDestroy}
 * @implements {OnChanges}
 */
@Component({
	selector: "n-dropdown-filter",
	template: `
		<div class="menu_filter-options">
			<label
				class="checkbox"
				*ngIf="type === 'multi'">
				<input
					#selectedOnly
					type="checkbox"
					[attr.disabled]="disableSelectedOnly"
					(click)="filterItems()">
				<span class="checkbox_label">{{ 'DROPDOWN.FILTER.SELECTED_ONLY' | translate }}</span>
			</label>
			<label class="search_group">
				<n-static-icon
					class="search_icon"
					aria-hidden="true"
					icon="search"
					size="sm">
				</n-static-icon>
				<input
					#filter
					(keyup)="filterItems()"
					type="search"
					tabindex="0"/>
				<button
					class="close"
					type="reset"
					attr.aria-label="{{ 'DROPDOWN.FILTER.RESET_SEARCH' | translate }}"
					[ngClass]="{
						visible: filter.value.trim()
					}"
					(click)="clearFilter()">
					<n-static-icon icon="x" size="sm" classList="close_icon"></n-static-icon>
				</button>
			</label>
		</div>
		<!-- clear selection -->
		<div
			#clearSelected
			tabindex="0"
			*ngIf="getSelected()"
			[ngClass]="{
				'clear-selection--sm': size === 'sm',
				'clear-selection': size === 'md' || size === 'default',
				'clear-selection--lg': size === 'lg'
			}"
			(click)="clearSelection()">
			{{ 'DROPDOWN.CLEAR' | translate}}
		</div>
		<!-- scroll up -->
		<div
			[ngStyle]="{display: canScrollUp ? 'flex' : 'none'}"
			class="scroll-arrow--up"
			style="justify-content: center;"
			(mouseover)="onHoverUp(true)"
			(mouseout)="onHoverUp(false)">
			<n-static-icon icon="carat_up" size="sm"></n-static-icon>
		</div>
		<!-- default is deprecated -->
		<ul
			#list
			[ngClass]="{
				'listbox--sm': size === 'sm',
				'listbox': size === 'md' || size === 'default',
				'listbox--lg': size === 'lg'
			}"
			role="listbox"
			(wheel)="onWheel($event)"
			(touchstart)="onTouchStart($event)"
			(touchmove)="onTouchMove($event)">
			<li tabindex="{{item.disabled ? -1 : 0}}"
				role="option"
				*ngFor="let item of displayItems"
				(click)="doClick($event, item)"
				(keydown)="doKeyDown($event, item)"
				[ngClass]="{
					selected: item.selected,
					disabled: item.disabled
				}">
				<!-- default is deprecated -->
				<label
					[ngClass]="{
						'checkbox--sm': size === 'sm',
						'checkbox': size === 'md' || size === 'default' || size === 'lg'
					}"
					*ngIf="type === 'multi'"
					style="margin: 0;">
					<input
						tabindex="-1"
						type="checkbox"
						[checked]="item.selected"
						(click)="doClick($event, item)">
					<label class="checkbox_label" style="margin: 0;"></label>
				</label>
				<span *ngIf="!listTpl">{{item.content}}</span>
				<ng-template
					*ngIf="listTpl"
					[ngTemplateOutletContext]="{item: item}"
					[ngTemplateOutlet]="listTpl">
				</ng-template>
			</li>
			<li
				class="no-results"
				*ngIf="displayItems.length === 0">
				<span>{{ 'DROPDOWN.FILTER.NO_RESULTS' | translate }}</span>
			</li>
		</ul>
		<div
			[ngStyle]="{display: canScrollDown ? 'flex' : 'none'}"
			class="scroll-arrow--down"
			style="justify-content: center;"
			(mouseover)="onHoverDown(true)"
			(mouseout)="onHoverDown(false)">
			<n-static-icon icon="carat_up" size="sm" style="transform: rotateX(180deg);"></n-static-icon>
		</div>`,
		providers: [
			{
				provide: AbstractDropdownView,
				useExisting: DropdownFilter
			}
		]
}) // conceptually this extends list-group, but we dont have to
export class DropdownFilter extends DropdownList implements AbstractDropdownView, AfterViewInit, OnDestroy, OnChanges {
	@ViewChild("selectedOnly") selectedOnly;
	/**
	 * Maintains a reference to the view DOM element for the unordered list of items.
	 * @type {ElementRef}
	 * @memberof DropdownFilter
	 */
	@ViewChild("list") list;
	/**
	 * Maintains a reference to the view DOM input element that allows filtering of values.
	 * @type {ElementRef}
	 * @memberof DropdownFilter
	 */
	@ViewChild("filter") filter;
	/**
	 * Keeps a reference to the "clear selection" element
	 */
	@ViewChild("clearSelected") clearSelected: ElementRef;
	/**
	 * Defines the rendering size of the `DropdownFilterList` input component.
	 * (size `"default"` is being deprecated as of neutrino v1.2.0, please use `"md"` instead)
	 * @type {("sm" | "md" | "default" | "lg")}
	 * @memberof DropdownFilter
	 */
	public size: "sm" | "md" | "default" | "lg" = "md";
	/**
	 * To maintain a local copy of the filter input element from the DOM.
	 * @memberof DropdownFilter
	 */
	public filterNative;
	public selectedOnlyNative;
	/**
	 * Set to `true` when there are no items selected and user should not have option to view only selected items.
	 * @memberof DropdownFilter
	 */
	public disableSelectedOnly = true;
	/**
	 * Holds the list of items that will be displayed in the `DropdownList`.
	 * It differs from the the complete set of items when filtering is used (but
	 * it is always a subset of the total items in `DropdownList`).
	 * @type {Array<ListItem>}
	 * @memberof DropdownFilter
	 */
	public displayItems: Array<ListItem> = [];
	/**
	 * Maintains the method to override keyboard events to allow navigation and selection within the `DropdownFilterList`.
	 * @protected
	 * @memberof DropdownFilter
	 */
	protected overrideKeydown = this._overrideKeydown.bind(this);

	/**
	 * Creates an instance of DropdownFilter.
	 * @param {ElementRef} elementRef
	 * @memberof DropdownFilter
	 */
	constructor(public elementRef: ElementRef) {
		super(elementRef);
	}

	/**
	 * Updates list when changes occur within the items belonging to the `DropdownList`.
	 * Additionally, the active filter string gets reset.
	 * @param {any} changes
	 * @returns null
	 * @memberof DropdownFilter
	 */
	ngOnChanges(changes) {
		if (changes.items) {
			this.items = changes.items.currentValue.map(item => Object.assign({}, item));
			this.displayItems = this.items;
			// the rest of this depends on the view being instantiated ...
			if (!this.filterNative) { return; }
			// reset everything
			if (this.type === "multi") {
				this.selectedOnlyNative.checked = null;
				this.disableSelectedOnly = true;
			}
			this.filterNative.value = "";
			setTimeout(() => {
				this.listElementList = Array.from(this.list.nativeElement.querySelectorAll("li")) as HTMLElement[];
			}, 0);
			this.index = this.items.findIndex(item => item.selected);
			this.setupFocusObservable();
		}
	}

	/**
	 * Retrieves array of list items and index of the selected item after view has rendered.
	 * Additionally, any Observables and EventListeners for the `DropdownFilterList` are initialized.
	 * @memberof DropdownFilter
	 */
	ngAfterViewInit() {
		this.listElementList = Array.from(this.list.nativeElement.querySelectorAll("li")) as HTMLElement[];
		this.index = this.items.findIndex(item => item.selected);
		this.setupFocusObservable();
		// just makes dealing with the nativeElement slightly less verbose
		this.filterNative = this.filter.nativeElement;
		this.selectedOnlyNative = this.selectedOnly ? this.selectedOnly.nativeElement : null;
		this.elementRef.nativeElement.addEventListener("keydown", this.overrideKeydown);
	}

	/**
	 * Removes any Observables or EventListers on destruction of the component.
	 * @memberof DropdownFilter
	 */
	ngOnDestroy() {
		this.elementRef.nativeElement.removeEventListener("keydown", this.overrideKeydown);
		if (this.focusJump) {
			this.focusJump.unsubscribe();
		}
	}

	/**
	 * Focuses the filter input first, instead of just calling `getCurrentElement()`
	 */
	initFocus() {
		this.filterNative.focus();
	}

	/**
	 * Overrides keyboard events to allow navigation and selection within the `DropdownFilterList`.
	 * @param {any} event
	 * @memberof DropdownFilter
	 */
	_overrideKeydown(event: KeyboardEvent) {
		if (event.key === "Tab" && !this.list.nativeElement.contains(event.target) && this.displayItems.length !== 0) {
			event.stopPropagation();
		} else if (event.key === "Tab" && event.shiftKey && this.list.nativeElement.contains(event.target)) {
			event.stopPropagation();
			event.preventDefault();
			this.filterNative.focus();
		} else if (event.key === "Enter" || (event.key === "ArrowDown" && !this.list.nativeElement.contains(event.target))) {
			event.preventDefault();
			this.listElementList[0].focus();
		}
	}

	/**
	 * Returns a list of the items that are being displayed in the DOM dropdown list.
	 * These items are a subset of all the items in the `DropdownList`.
	 * @param {ListItem[]} items
	 * @param {string} [query=""]
	 * @param {boolean} [selectedOnly=false]
	 * @returns {ListItem[]}
	 * @memberof DropdownFilter
	 */
	getDisplayItems(items: ListItem[], query = "", selectedOnly = false): ListItem[] {
		if (selectedOnly) {
			return items.filter(item => item.content.toLowerCase().includes(query.toLowerCase()) && item.selected);
		} else if (query) {
			return items.filter(item => item.content.toLowerCase().includes(query.toLowerCase()));
		}
		return items;
	}

	/**
	 * Refactors the display items for the `DropdownList`. The items displayed are contingent on the filter string.
	 * @memberof DropdownFilter
	 */
	filterItems() {
		let selected = this.type === "multi" ? this.selectedOnlyNative.checked : false;
		this.displayItems = this.getDisplayItems(this.items, this.filterNative.value, selected);
		// we still want to jump, so we just have to reset this
		// wait a tick to let the view update
		setTimeout(() => this.setupFocusObservable());
	}

	/**
	 * Clears the filtering of the list items for the `DropdownFilterList` input component.
	 * @memberof DropdownFilter
	 */
	clearFilter() {
		this.filterNative.value = "";
		this.displayItems = this.items;
		// wait a tick to let the view update
		setTimeout(() => this.setupFocusObservable());
	}

	/**
	 * Emits the selected item or items after a mouse click event has occurred.
	 * @param event
	 * @param item
	 * @memberof DropdownFilter
	 */
	doClick(event: any, item: ListItem) {
		item.selected = !item.selected;
		if (this.type === "single") {
			// reset the selection
			for (let otherItem of this.items) {
				if (item !== otherItem) { otherItem.selected = false; }
			}
			this.displayItems = this.getDisplayItems(this.items, this.filterNative.value);
			if (!item.disabled) {
				this.select.emit({item});
			}
		} else {
			if (this.getSelected()) {
				this.disableSelectedOnly = null;
			} else {
				this.disableSelectedOnly = true;
				this.selectedOnlyNative.checked = false;
			}
			this.displayItems = this.getDisplayItems(this.items,
					this.filterNative.value,
					this.selectedOnlyNative.checked);
			this.select.emit(this.getSelected());
		}
		this.index = this.items.indexOf(item);
		// wait a tick to let changes take effect on the DOM
		setTimeout(() => {
			// to prevent arrows from being hidden
			this.updateScrollHeight();
		});
	}
}
