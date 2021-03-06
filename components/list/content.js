import { iterateArrayLike, dispatchDomEvent } from '../../core/dom';
import * as Overlay from '../../core/overlay/index';
import * as Ripple from '../../core/ripple/index';
import * as Attributes from '../../core/aria/attributes';

import * as ListSecondary from './secondary';

export const ACTIVATE_EVENT = 'mdw:listcontent-activate';
export const SELECTED_CHANGE_EVENT = 'mdw:listcontent-selectedchange';
export const CHECKED_CHANGE_EVENT = 'mdw:listcontent-checkedchange';
export const FOCUS_EVENT = 'mdw:listcontent-focus';

/**
 * @param {Element} listContentElement
 * @return {void}
 */
export function attach(listContentElement) {
  attachCore(listContentElement);
  if (!listContentElement.hasAttribute('mdw-no-overlay')) {
    listContentElement.classList.add('mdw-overlay');
    Overlay.attach(listContentElement);
  }
  if (!listContentElement.hasAttribute('mdw-no-ripple')) {
    listContentElement.classList.add('mdw-ripple');
    Ripple.attach(listContentElement);
  }
  if (listContentElement.getAttribute('role') === 'radio'
  && listContentElement.getAttribute('aria-checked') === 'true'
  && listContentElement.getAttribute('tabindex') !== '0') {
    listContentElement.setAttribute('tabindex', '0');
  }
  const secondaryElement = listContentElement.getElementsByClassName('mdw-list__secondary')[0];
  if (secondaryElement) {
    ListSecondary.attach(secondaryElement);
  }
  listContentElement.addEventListener(ListSecondary.SECONDARY_ACTION_EVENT, onSecondaryAction);
}

/**
 * @param {KeyboardEvent} event
 * @return {void}
 */
function onKeyDown(event) {
  if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
    return;
  }
  if (event.key !== 'Enter' && event.key !== 'Spacebar' && event.key !== ' ') {
    return;
  }
  if (document.activeElement !== event.currentTarget) {
    return;
  }
  /** @type {HTMLElement} */
  const listContentElement = (event.currentTarget);
  if (!listContentElement) {
    return;
  }
  event.stopPropagation();
  event.preventDefault();

  if (isDisabled(listContentElement)) {
    return;
  }

  if (event.key === 'Spacebar' || event.key === ' ') {
    if (onCheckToggleRequest(listContentElement)) {
      return;
    }
  }

  // Slightly redundant, but performs ripple
  const newEvent = document.createEvent('Event');
  newEvent.initEvent('click', true, true);
  listContentElement.dispatchEvent(newEvent);
}

/**
 * @param {Element} listContentElement
 * @return {boolean} handled
 */
function onCheckToggleRequest(listContentElement) {
  const currentValue = listContentElement.getAttribute('aria-checked');
  if (currentValue == null) {
    // Attribute does not exist
    return false;
  }
  let newValue = currentValue === 'true' ? 'false' : 'true';
  if (newValue === 'false' && listContentElement.getAttribute('role') === 'radio') {
    newValue = 'true';
  }
  Attributes.setChecked(listContentElement, newValue, CHECKED_CHANGE_EVENT);
  return true;
}

/**
 * @param {Element} listContentElement
 * @return {void}
 */
export function attachCore(listContentElement) {
  if (!listContentElement.hasAttribute('role')) {
    if (listContentElement.parentElement.getAttribute('role') === 'none') {
      listContentElement.setAttribute('role', 'option');
    }
  }
  iterateArrayLike(listContentElement.getElementsByClassName('mdw-list__icon'), (el) => {
    el.setAttribute('aria-hidden', 'true');
  });
  iterateArrayLike(listContentElement.getElementsByClassName('mdw-list__avatar'), (el) => {
    el.setAttribute('aria-hidden', 'true');
  });
  listContentElement.addEventListener('click', onClick);
  listContentElement.addEventListener('keydown', onKeyDown);
  listContentElement.addEventListener('focus', onFocus);
}

/**
 * Sets [aria-checked="true"] on Focus if [role="radio"]
 * @param {FocusEvent} event
 * @return {void}
 */
export function onFocus(event) {
  /** @type {HTMLElement} */
  const listContentElement = (event.currentTarget);
  dispatchDomEvent(listContentElement, FOCUS_EVENT);
}

/**
 * @param {MouseEvent|KeyboardEvent|PointerEvent} event
 * @return {void}
 */
export function onSecondaryAction(event) {
  /** @type {HTMLElement} */
  const listContentElement = (event.currentTarget);
  if (isDisabled(listContentElement)) {
    event.stopPropagation();
    event.preventDefault();
    return;
  }
  onCheckToggleRequest(listContentElement);

  // Regardless if checkable, event is propagated up
}

/**
 * @param {MouseEvent|KeyboardEvent|PointerEvent} event
 * @return {void}
 */
export function onClick(event) {
  event.preventDefault();
  /** @type {HTMLElement} */
  const listContentElement = (event.currentTarget);
  if (isDisabled(listContentElement)) {
    return;
  }
  const secondaryElement = listContentElement.getElementsByClassName('mdw-list__secondary')[0];
  if (!secondaryElement || !secondaryElement.hasAttribute('mdw-action')) {
    if (onCheckToggleRequest(listContentElement)) {
      return;
    }
  }
  dispatchDomEvent(listContentElement, ACTIVATE_EVENT);
}

/**
 * @param {Element} element
 * @return {boolean}
 */
export function isDisabled(element) {
  return (element.getAttribute('aria-disabled') === 'true');
}

/**
 * @param {Element} listContentElement
 * @return {void}
 */
export function detachCore(listContentElement) {
  listContentElement.removeEventListener('click', onClick);
  listContentElement.removeEventListener('keydown', onKeyDown);
}

/**
 * @param {Element} listContentElement
 * @return {void}
 */
export function detach(listContentElement) {
  detachCore(listContentElement);
  const secondaryElement = listContentElement.getElementsByClassName('mdw-list__secondary')[0];
  if (secondaryElement) {
    ListSecondary.detach(secondaryElement);
  }
  listContentElement.removeEventListener(ListSecondary.SECONDARY_ACTION_EVENT, onSecondaryAction);
  Ripple.detach(listContentElement);
  Overlay.detach(listContentElement);
}

/**
 * @param {Element} element
 * @param {string|boolean} value
 * @param {boolean} [dispatchEvent=true]
 * @return {boolean} successful
 */
export function setSelected(element, value, dispatchEvent = true) {
  return Attributes.setSelected(element, value, dispatchEvent ? SELECTED_CHANGE_EVENT : null);
}

/**
 * @param {Element} element
 * @param {string|boolean} value
 * @param {boolean} [dispatchEvent=true]
 * @return {boolean} successful
 */
export function setChecked(element, value, dispatchEvent = true) {
  return Attributes.setChecked(element, value, dispatchEvent ? CHECKED_CHANGE_EVENT : null);
}

// Alias
export const { setCurrent } = Attributes;
