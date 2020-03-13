import ArrowElement from './ArrowElement';

class BlockElement implements Flowy.BlockElement.BlockElementInterface {
  id: number;
  node: HTMLDivElement;
  window: Window;

  static find = (id, { window }) => {
    const { document } = window;
    const node = document.querySelector(`.blockid[value='${id}']`);

    return (node !== null) ? new BlockElement(id, node.parentNode, { window }) : null;
  }

  static fromElement = (node, { window }) => {
    const input = node.querySelector('.blockid');

    return (input !== null) ? new BlockElement(parseInt(input.value, 10), node, { window }) : null;
  }

  constructor(id, node, { window }) {
    this.id = parseInt(id, 10);
    this.node = node;
    this.window = window;
  }

  position = () => {
    const { top, left } = this.node.getBoundingClientRect();
    const { height, width } = this.window.getComputedStyle(this.node);

    return {
      top: top + this.window.scrollY,
      left: left + this.window.scrollX,
      height: height ? parseInt(height, 10) : 0,
      width: width ? parseInt(width, 10) : 0,
    };
  }

  styles = (styles) => {
    return Object.assign(this.node.style, styles);
  }

  arrow = () => {
    return ArrowElement.find(this);
  }
}

export default BlockElement;
