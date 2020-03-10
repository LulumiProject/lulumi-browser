declare namespace Flowy {
  export namespace Flowy {
    export interface FlowyElementConstructor {
      new (canvas: HTMLDivElement, onGrab: ((block: HTMLDIVelement) => any) | undefined, onRelease: (() => any) | undefined, onSnap: ((block: HTMLDIVelement, first?: boolean, parent?: HTMLDIVelement) => any) | undefined, spacingX: number, spacingY: number);
    }
    export interface FlowyElementInterface {
      id: number;
      node: HTMLDivElement;
      window: Window;
      onGrab: ((block: HTMLDIVelement) => any) | undefined;
      onRelease: (() => any) | undefined;
      onSnap: ((block: HTMLDIVelement, first?: boolean, parent?: HTMLDIVelement | undefined) => any) | undefined;
      import: ((data: any) => void) | undefined;
      output: (() => any) | undefined;
      deleteBlocks: (() => void) | undefined;

      engine: (document: Document, canvas: Canvas.CanvasInterface, onGrab: ((block: HTMLDIVelement) => any) | undefined, onRelease: (() => any) | undefined, onSnap: ((block: HTMLDIVelement, first?: boolean, parent?: HTMLDIVelement | undefined) => any) | undefined) => void;
    }
  }

  export namespace Canvas {
    export interface RemoveOption {
      remove: boolean;
    }
    export interface State extends Object {
      mouseX?: number;
      mouseY?: number;
      dragX?: number;
      dragY?: number;
      currentOffsetLeft?: number;
      previousOffsetLeft?: number;
    }
    export interface Position {
      top: number;
      left: number;
      scrollTop: number;
      scrollLeft: number;
    }
    export interface CanvasOptions {
      window: Window;
      document: Document;
      node: HTMLDivElement;
      spacingX?: number;
      spacingY?: number;
    }
    export interface CanvasConstructor {
      new (options: CanvasOptions);
    }
    export interface CanvasInterface {
      window: Window;
      document: Document;
      node: HTMLDivElement;
      spacingX: number;
      spacingY: number;
      state: State;
      blocks: BlockInterface[];
      isInitialized: boolean;
      isDragging: boolean;
      isDraggingBlock: boolean;
      isRearranging: boolean;
      isLastEvent: boolean;
      grabbedNode: HTMLDivElement | null;
      draggedElement: Flowy.BlockElement.BlockElementInterface | null;
      draggedTree: Flowy.Block.BlockInterface[];

      initialize: () => void;
      position: () => Position;
      html: (html?: string) => string;
      appendHtml: (html: string) => void;
      appendChild: (...children: HTMLDivElement[]) => void;
      findBlockElement: (id: number) => BlockElementInterface | null;
      import: (data: any) => void;
      pageX: (element: HTMLElement) => number;
      pageY: (element: HTMLElement) => number;
      grab: (grabbedNode: HTMLDivElement) => HTMLDivElement;
      registerDragger: (draggedNode: HTMLDivElement) => void;
      toggleDragger: (start: boolean, option?: RemoveOption) => void;
      nextBlockID: () => number;
      addBlockForElement: (blockElement: BlockElement.BlockElementInterface, option: BlockElement.BlockElementOptions) => void;
      findBlock: (id: number, option?: any) => Block.BlockInterface | undefined;
      replaceBlocks: (blocks: Block.BlockInterface[]) => void;
      appendBlocks: (blocks: Block.BlockInterface[]) => void;
      removeBlock: (block: Block.BlockInterface, option?: any) => void;
      findChildBlocks: (id: number) => Block.BlockInterface[];
      output: () => any;
      reset: () => void;
      groupDraggedTree: () => void;
      ungroupDraggedTree: () => void;
      inSnapZoneFor: (block: Block.BlockInterface) => boolean;
      inDropZone: () => boolean;
      drop: () => void;
      cancelDrop: () => void;
      indicator: () => HTMLDivElement | null;
      showIndicator: (show: boolean, block?: boolean) => void;
      updateDragPosition: () => void;
      updateRearrangePosition: () => void;
      setState: (state: State) => State;
      getState: (key: string) => any;
      toggleDragging: (dragging: boolean) => void;
      toggleDraggingBlock: (dragging: boolean) => void;
      toggleRearranging: (rearranging: boolean) => void;
      toggleLastEvent: (last: boolean) => void;
    }
  }

  export namespace BlockElement {
    export interface Position {
      top: number;
      left: number;
      height: number;
      width: number;
    }
    export interface BlockElementOptions {
      window?: Window;
      parent?: number;
      childWidth?: number;
    }
    export interface BlockElementConstructor {
      new (id: number, node: HTMLDivElement, options: BlockElementOptions);
      static find: (id: number, options: BlockElementOptions) => BlockElementInterface | null;
      static fromElement: (node: HTMLDivElement, options: BlockElementOptions) => BlockElementInterface | null;
    }
    export interface BlockElementInterface {
      id: number;
      node: HTMLDivElement;
      window: Window;

      position: () => Position;
      styles: (styles: any) => CSSStyleDeclaration;
      arrow: () => any;
    }
  }

  export namespace ArrowElement {
    export interface Position {
      top: number;
      left: number;
    }
    export interface ArrowElementConstructor {
      new (blockElement: BlockElement.BlockElementInterface, node: HTMLDivElement);
      static find: (blockElement: BlockElement.BlockElementInterface) => ArrowElementInterface | null;
    }
    export interface ArrowElementInterface {
      blockElement: BlockElement.BlockElementInterface;
      node: HTMLDivElement;
      window: Window;
      document: HTMLDivElement;

      html: (html?: string) => string;
      position: () => Position;
      styles: (styles: any) => CSSStyleDeclaration;
      remove: () => void;
    }
  }

  export namespace Block {
    export interface BlockOptions {
      parent: number;
      childWidth: number;
      id: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }
    export interface BlockConstructor {
      new (options: BlockOptions);
    }
    export interface BlockInterface {
      parent: number;
      childWidth: number;
      id: number;
      x: number;
      y: number;
      width: number;
      height: number;

      maxWidth: () => number;
    }
  }
}
