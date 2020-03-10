class Block implements Flowy.Block.BlockInterface {
  parent: number;
  childWidth: number;
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;

  constructor({ parent, childWidth, id, x, y, width, height }) {
    Object.assign(this, {
      parent,
      childWidth,
      id,
      x,
      y,
      width,
      height,
    });
  }

  maxWidth = () => Math.max(this.childWidth, this.width);
}

export default Block;
