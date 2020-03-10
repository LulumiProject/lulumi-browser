import BlockElement from './BlockElement';
import Block from './Block';

class Canvas implements Flowy.Canvas.CanvasInterface {
  window: Window;
  document: Document;
  node: HTMLDivElement;
  spacingX: number;
  spacingY: number;
  state: Flowy.Canvas.State;
  blocks: Flowy.Block.BlockInterface[];
  isInitialized: boolean;
  isDragging: boolean;
  isDraggingBlock: boolean;
  isRearranging: boolean;
  isLastEvent: boolean;
  grabbedNode: HTMLDivElement | null;
  draggedElement: Flowy.BlockElement.BlockElementInterface | null;
  draggedTree: Flowy.Block.BlockInterface[];

  constructor({ window, document, node, spacingX = 20, spacingY = 80 }) {
    this.window = window;
    this.document = document;
    this.node = node;
    this.spacingX = spacingX;
    this.spacingY = spacingY;

    this.state = {
      mouseX: 0,
      mouseY: 0,
      dragX: 0,
      dragY: 0,
      currentOffsetLeft: 0,
      previousOffsetLeft: 0,
    };
    this.blocks = [];
    this.isInitialized = false;
    this.isDragging = false;
    this.isDraggingBlock = false;
    this.isRearranging = false;
    this.isLastEvent = false;
    this.grabbedNode = null;
    this.draggedElement = null;
    this.draggedTree = [];
  }

  initialize = () => {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    this.reset();
  }

  position = () => {
    const { top, left } = this.node.getBoundingClientRect();

    return {
      top: top + this.window.scrollY,
      left: left + this.window.scrollX,
      scrollTop: this.node.scrollTop,
      scrollLeft: this.node.scrollLeft,
    };
  }

  html = (html?: string): string => {
    if (html !== undefined) {
      this.node.innerHTML = html;
    }

    return this.node.innerHTML;
  }

  appendHtml = html => (this.node.innerHTML += html);

  appendChild = (...children) => {
    children.forEach(child => this.node.appendChild(child));
  }

  findBlockElement = id => BlockElement.find(id, { window: this.window });

  import = ({ html, blockarr }) => {
    this.html(html);
    this.replaceBlocks(blockarr);
  }

  pageX = (element: HTMLElement) => {
    return element.offsetParent
      ? element.offsetLeft + this.pageX(element.offsetParent as HTMLElement)
      : element.offsetLeft;
  }

  pageY = (element: HTMLElement) => {
    return element.offsetParent
      ? element.offsetTop + this.pageY(element.offsetParent as HTMLElement)
      : element.offsetTop;
  }

  grab = (grabbedNode: HTMLDivElement) => {
    const { mouseX, mouseY } = this.state;
    const draggedNode = grabbedNode.cloneNode(true) as HTMLDivElement;
    const id = this.nextBlockID();

    draggedNode.classList.remove('create-flowy');
    draggedNode.innerHTML += `<input type='hidden' name='blockid' class='blockid' value='${id}'>`;

    this.document.body.appendChild(draggedNode);

    this.grabbedNode = grabbedNode;

    this.registerDragger(draggedNode);

    if (mouseX && mouseY) {
      const { dragX, dragY } = this.setState({
        dragX: mouseX - this.pageX(grabbedNode as HTMLElement),
        dragY: mouseY - this.pageY(grabbedNode as HTMLElement),
      });

      this.draggedElement!.styles({
        left: mouseX - dragX,
        top: mouseY - dragY,
      });
    }

    this.toggleDragger(true);

    return draggedNode;
  }

  registerDragger = (draggedNode) => {
    this.draggedElement = BlockElement.fromElement(draggedNode, { window: this.window });
  }

  toggleDragger = (start, { remove = false } = {}) => {
    const draggedElement = this.draggedElement;

    if (draggedElement && this.grabbedNode) {
      if (start) {
        this.grabbedNode.classList.add('dragnow');
        draggedElement.node.classList.add('dragging');
        draggedElement.node.classList.add('block');
      } else {
        this.grabbedNode.classList.remove('dragnow');
        draggedElement.node.classList.remove('dragging');

        if (remove) {
          draggedElement.node.remove();
        }
      }
    }
  }

  nextBlockID = () => (this.blocks.length === 0)
    ? 0
    : Math.max(...this.blocks.map(({ id }) => id)) + 1

  addBlockForElement = (blockElement, { parent = -1, childWidth = 0 } = {}) => {
    const { scrollLeft, scrollTop } = this.position();

    this.blocks.push(
      new Block({
        parent,
        childWidth,
        id: blockElement.id,
        x: blockElement.position().left + blockElement.position().width / 2 + scrollLeft,
        y: blockElement.position().top + blockElement.position().height / 2 + scrollTop,
        width: blockElement.position().width,
        height: blockElement.position().height,
      }),
    );
  }

  findBlock = (id, { tree = false } = {}) => ((tree)
    ? this.draggedTree
    : this.blocks).find(block => (block.id === id))

  replaceBlocks = blocks => this.blocks.splice(0, this.blocks.length, ...blocks);

  appendBlocks = blocks => this.blocks.push(...blocks);

  removeBlock = (block, { removeArrow = false } = {}) => {
    this.replaceBlocks(this.blocks.filter(({ id }) => (id !== block.id)));

    // remove arrow for child blocks
    if (removeArrow) {
      const blockElement = this.findBlockElement(block.id);
      if (blockElement) {
        const arrowElement = blockElement.arrow();

        if (arrowElement) {
          arrowElement.remove();
        }
      }
    }
  }

  findChildBlocks = (id) => {
    return this.blocks.filter(({ parent }) => (parent === id));
  }

  output = () => {
    const blocks = this.blocks;

    if (blocks.length === 0) {
      return null;
    }

    return {
      html: this.html(),
      blockarr: blocks.slice(),
      blocks: blocks.map(({ id, parent }) => {
        const node = this.findBlockElement(id)!.node;

        return {
          id,
          parent,
          data: [...node.querySelectorAll('input')].map(({ name, value }) => ({ name, value })),
          attr: [...node.attributes].map(({ name, value }) => ({ name, value })),
        };
      }),
    };
  }

  reset = () => {
    this.html('<div class="indicator invisible"></div>');
    this.blocks.splice(0);
  }

  groupDraggedTree = () => {
    const draggedElement = this.draggedElement!;
    const { top, left } = draggedElement.position();
    const draggedBlock = this.findBlock(draggedElement.id)!;

    this.draggedTree.push(draggedBlock);
    // remove dragged block from canvas
    this.removeBlock(draggedBlock, { removeArrow: true });

    const childBlocks = this.findChildBlocks(draggedBlock.id);
    let layer = childBlocks;
    const allBlocks: Flowy.Block.BlockInterface[] = [];

    // Move child block DOM nodes into dragged block node for easier dragging
    do {
      const foundids = layer.map(({ id }) => id);

      layer.forEach((block) => {
        this.draggedTree.push(block);

        const blockElement = this.findBlockElement(block.id)!;
        const arrowElement = blockElement.arrow()!;

        blockElement.styles({
          left: blockElement.position().left - left,
          top: blockElement.position().top - top,
        });
        arrowElement.styles({
          left: arrowElement.position().left - left,
          top: arrowElement.position().top - top,
        });

        draggedElement.node.appendChild(blockElement.node);
        draggedElement.node.appendChild(arrowElement.node);
      });

      allBlocks.push(...layer);

      // finds next children
      layer = this.blocks.filter(({ parent }) => foundids.includes(parent));
    } while (layer.length);

    childBlocks.forEach(block => this.removeBlock(block));
    allBlocks.forEach(block => this.removeBlock(block));
  }

  ungroupDraggedTree = () => {
    const draggedElement = this.draggedElement!;

    this.draggedTree.forEach((block) => {
      if (block.id === draggedElement.id) {
        return;
      }

      const blockElement = this.findBlockElement(block.id)!;
      const arrowElement = blockElement.arrow()!;
      const { left, top, scrollLeft, scrollTop } = this.position();

      blockElement.styles({
        left: blockElement.position().left - left + scrollLeft,
        top: blockElement.position().top - top + scrollTop,
      });

      arrowElement.styles({
        left: arrowElement.position().left - left + scrollLeft,
        top: arrowElement.position().top - (top + scrollTop),
      });

      this.appendChild(blockElement.node, arrowElement.node);

      block.x = blockElement.position().left + blockElement.node.offsetWidth / 2 + scrollLeft;
      block.y = blockElement.position().top + blockElement.node.offsetHeight / 2 + scrollTop;
    });

    const rootBlock = this.draggedTree.find(({ id }) => (id === 0));

    if (rootBlock) {
      rootBlock.x = draggedElement.position().left + draggedElement.position().width / 2;
      rootBlock.y = draggedElement.position().top + draggedElement.position().height / 2;
    }

    this.appendBlocks(this.draggedTree);
    this.draggedTree.splice(0);
  }

  inSnapZoneFor = (block) => {
    const { x, y, width, height } = block;
    const { left, top, width: draggedWidth } = this.draggedElement!.position();
    const { scrollLeft, scrollTop } = this.position();

    const zoneX = left + draggedWidth / 2 + scrollLeft;
    const zoneY = top + scrollTop;

    return (
      zoneX >= x - width / 2 - this.spacingX &&
      zoneX <= x + width / 2 + this.spacingX &&
      zoneY >= y - height / 2 &&
      zoneY <= y + height
    );
  }

  inDropZone = () => {
    const { top, left } = this.draggedElement!.position();

    return (top > this.position().top) && (left > this.position().left);
  }

  drop = () => {
    const draggedElement = this.draggedElement!;
    const { top, left, scrollTop, scrollLeft } = this.position();

    draggedElement.styles({
      top: draggedElement.position().top - top + scrollTop,
      left: draggedElement.position().left - left + scrollLeft,
    });

    this.appendChild(draggedElement.node);
    this.addBlockForElement(draggedElement);
  }

  cancelDrop = () => {
    this.appendChild(this.indicator());
    this.toggleDragger(false, { remove: true });
  }

  indicator = () => this.document.querySelector('.indicator') as HTMLDivElement | null;

  showIndicator = (show, block) => {
    const indicator = this.indicator();

    if (indicator) {
      if (show) {
        if (block) {
          const blockElement = this.findBlockElement(block.id)!;
          blockElement.node.appendChild(indicator);

          indicator.style.left = `${this.draggedElement!.position().width / 2 - 5}px`;
          indicator.style.top = `${blockElement.position().height}px`;
        }

        indicator.classList.remove('invisible');
      } else if (!indicator.classList.contains('invisible')) {
        indicator.classList.add('invisible');
      }
    }
  }

  updateDragPosition = () => {
    const { mouseX, mouseY, dragX, dragY } = this.state;

    if (mouseX && mouseY && dragX && dragY) {
      this.draggedElement!.styles({
        left: mouseX - dragX,
        top: mouseY - dragY,
      });
    }
  }

  updateRearrangePosition = () => {
    const { mouseX, mouseY, dragX, dragY } = this.state;
    const { left, top, scrollLeft, scrollTop } = this.position();

    if (mouseX && mouseY && dragX && dragY) {
      this.draggedElement!.styles({
        left: mouseX - dragX - left + scrollLeft,
        top: mouseY - dragY - top + scrollTop,
      });
    }
  }

  setState = (state) => {
    return Object.assign(this.state, state);
  }

  getState = key => this.state[key];

  toggleDragging = dragging => (this.isDragging = dragging);

  toggleDraggingBlock = dragging => (this.isDraggingBlock = dragging);

  toggleRearranging = rearranging => (this.isRearranging = rearranging);

  toggleLastEvent = last => (this.isLastEvent = last);
}

export default Canvas;
