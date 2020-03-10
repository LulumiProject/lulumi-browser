const flowy = function (canvas, grab, release, snapping, spacingX, spacingY) {
  // event listeners
  if (!grab) {
    grab = function () {};
  }
  if (!release) {
    release = function () {};
  }
  if (!snapping) {
    snapping = function () {
      return true;
    };
  }

  function blockGrabbed(block) {
    grab(block);
  }

  function blockReleased() {
    release();
  }

  function blockSnap(drag, first, parent) {
    return snapping(drag, first, parent);
  }

  if (!spacingX) {
    spacingX = 20;
  }
  if (!spacingY) {
    spacingY = 80;
  }

  let loaded = false;
  flowy.load = function () {
    if (loaded) {
      return;
    }

    loaded = true;

    let blocks = [];
    let tmpBlocks = [];
    let canvasDiv = canvas;
    let dragging = false;
    let paddingX = spacingX;
    let paddingY = spacingY;
    let offsetLeft = 0;
    let offsetLeftOld = 0;
    let rearrange = false;
    let lastEvent = false;
    let drag, dragX, dragY, original;
    let mouseX, mouseY;
    let dragBlock = false;
    let el = document.createElement("DIV");

    el.classList.add('indicator');
    el.classList.add('invisible');
    canvasDiv.appendChild(el);

    // import the flow from the given output
    flowy.import = function (output) {
      canvasDiv.innerHTML = JSON.parse(output.html);
      blocks = output.blockarr;
    }

    // export the flow
    flowy.output = function () {
      const serializedHTML = JSON.stringify(canvasDiv.innerHTML);
      const jsonData = {
        html: serializedHTML,
        blockarr: blocks,
        blocks: [],
      };

      if (blocks.length > 0) {
        for (let i = 0; i < blocks.length; i += 1) {
          jsonData.blocks.push({
            id: blocks[i].id,
            parent: blocks[i].parent,
            data: [],
            attr: [],
          });

          const blockElement = document.querySelector(`.blockid[value="${blocks[i].id}"]`).parentNode;
          blockElement.querySelectorAll('input').forEach((input) => {
            jsonData.blocks[i].data.push({
              name: input.getAttribute('name'),
              value: input.value,
            });
          });
          Array.prototype.slice.call(blockElement.attributes).forEach((attribute) => {
            const obj = {};
            obj[attribute.name] = attribute.value;
            jsonData.blocks[i].attr.push(obj);
          });
        }
        return jsonData;
      }
    }

    flowy.deleteBlocks = function () {
      blocks = [];
      canvasDiv.innerHTML = '<div class="indicator invisible"></div>';
    }

    /* drag blocks from sidebar */
    function beginDrag(event) {
      // 1: left-click, 2: middle-click, 3: right-click
      if (event.which !== 3 && event.target.closest('.create-flowy')) {
        original = event.target.closest('.create-flowy');
        original.classList.add('dragnow');

        // deep-clone the node including all children
        const newNode = original.cloneNode(true);
        newNode.classList.add('block');
        newNode.classList.remove('create-flowy');

        const nextId = (blocks.length === 0) ? 0 /* first block */ : (Math.max.apply(Math, blocks.map(block => block.id)) + 1);
        newNode.innerHTML += `<input type="hidden" name="blockid" class="blockid" value="${nextId}">`;
        document.body.appendChild(newNode);
        drag = document.querySelector(`.blockid[value="${nextId}"]`).parentNode;

        // emit the onGrab event
        blockGrabbed(original);

        drag.classList.add('dragging');
        dragging = true;

        // update positions of the grabbed node
        mouseX = event.clientX;
        mouseY = event.clientY;
        dragX = mouseX - pageX(original);
        dragY = mouseY - pageY(original);
        drag.style.left = `${mouseX - dragX}px`;
        drag.style.top = `${mouseY - dragY}px`;
      }
    }

    /* drag blocks within canvas */
    function touchblock(event) {
      if (event.which != 3 && hasParentClass(event.target, 'block')) {
        if (!dragging && !rearrange) {
          dragBlock = true;
          drag = event.target.closest('.block');
          dragX = event.clientX - (drag.getBoundingClientRect().left + window.scrollX);
          dragY = event.clientY - (drag.getBoundingClientRect().top + window.scrollY);
        }
      }
    }

    function moveBlock(event) {
      mouseX = event.clientX;
      mouseY = event.clientY;

      // drag blocks within canvas
      if (dragBlock) {
        // it means we're arranging positions
        rearrange = true;
        drag.classList.add('dragging');

        const thisId = parseInt(drag.querySelector('.blockid').value, 10);
        if (thisId !== 0) {
          document.querySelector(`.arrowid[value="${thisId}"]`).parentNode.remove();
        }

        tmpBlocks.push(blocks.filter(block => (block.id === thisId))[0]);
        blocks = blocks.filter(block => (block.id !== thisId));

        let flag = false;
        let foundIds = [];
        const allIds = [];
        const dragRect = drag.getBoundingClientRect();

        let childBlocks = blocks.filter(block => (block.parent === thisId));
        // make all children of the dragged block as-is, whereas draggable
        while (!flag) {
          for (let i = 0; i < childBlocks.length; i += 1) {
            if (childBlocks[i].id !== thisId) {
              const childBlock = blocks.filter(block => (block.id === childBlocks[i].id))[0];
              tmpBlocks.push(childBlock);
              foundIds.push(childBlock.id);
              allIds.push(childBlock.id);

              const blockElement = document.querySelector(`.blockid[value="${childBlock.id}"]`).parentNode;
              const arrowBlock = document.querySelector(`.arrowid[value="${childBlock.id}"]`).parentNode;
              const blockElementRect = blockElement.getBoundingClientRect();
              const arrowBlockRect = arrowBlock.getBoundingClientRect();

              blockElement.style.left = `${(blockElementRect.left + window.scrollX) - (dragRect.left + window.scrollX)}px`;
              blockElement.style.top = `${(blockElementRect.top + window.scrollY) - (dragRect.top + window.scrollY)}px`;
              arrowBlock.style.left = `${(arrowBlockRect.left + window.scrollX) - (dragRect.left + window.scrollX)}px`;
              arrowBlock.style.top = `${(arrowBlockRect.top + window.scrollY) - (dragRect.top + window.scrollY)}px`;

              drag.appendChild(blockElement);
              drag.appendChild(arrowBlock);
            }
          }
          if (foundIds.length === 0) {
            flag = true;
          } else {
            childBlocks = blocks.filter(block => foundIds.includes(block.parent));
            foundIds = [];
          }
        }

        for (let i = 0; i < allIds.length; i += 1) {
          blocks = blocks.filter(block => (block.id !== allIds[i]));
        }

        if (blocks.length > 1) {
          rearrangeMe();
        }

        if (lastEvent) {
          fixOffset();
        }

        dragBlock = false;
      }

      if (dragging) {
        drag.style.left = `${mouseX - dragX}px`;
        drag.style.top = `${mouseY - dragY}px`;
      } else if (rearrange) {
        const canvasDivRect = canvasDiv.getBoundingClientRect();
        const thisId = parseInt(drag.querySelector('.blockid').value, 10);

        drag.style.left = `${mouseX - dragX - (canvasDivRect.left + window.scrollX) + canvasDiv.scrollLeft}px`;
        drag.style.top = `${mouseY - dragY - (canvasDivRect.top + window.scrollY) + canvasDiv.scrollTop}px`;

        tmpBlocks.filter(block => (block.id === thisId)).x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvasDiv.scrollLeft;
        tmpBlocks.filter(block => (block.id === thisId)).y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvasDiv.scrollTop;
      }
      if (dragging || rearrange) {
        const dragRect = drag.getBoundingClientRect();
        const xPos = (dragRect.left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvasDiv.scrollLeft;
        const yPos = (dragRect.top + window.scrollY) + canvasDiv.scrollTop;
        const blockIds = blocks.map(block => block.id);

        for (let i = 0; i < blocks.length; i += 1) {
          const self = blocks.filter(block => (block.id === blockIds[i]))[0];
          const x = self.x;
          const y = self.y;
          const width = self.width;
          const height = self.height;

          if (xPos >= x - (width / 2) - paddingX && xPos <= x + (width / 2) + paddingX && yPos >= y - (height / 2) && yPos <= y + height) {
            const block = document.querySelector(`.blockid[value="${self.id}"]`);
            block.parentNode.appendChild(document.querySelector('.indicator'));
            document.querySelector('.indicator').style.left = `${(parseInt(window.getComputedStyle(block.parentNode).width, 10) / 2) - 5}px`;
            document.querySelector('.indicator').style.top = `${window.getComputedStyle(block.parentNode).height}px`;
            document.querySelector('.indicator').classList.remove('invisible');
            break;
          } else if (i === blocks.length - 1) {
            if (!document.querySelector('.indicator').classList.contains('invisible')) {
              document.querySelector('.indicator').classList.add('invisible');
            }
          }
        }
      }
    }

    function endDrag(event) {
      // 1: left-click, 2: middle-click, 3: right-click
      if (event.which !== 3 && (dragging || rearrange)) {
        // emit the onRelease event
        blockReleased();

        if (!document.querySelector('.indicator').classList.contains('invisible')) {
          document.querySelector('.indicator').classList.add('invisible');
        }

        // stop tracking
        if (dragging) {
          original.classList.remove('dragnow');
          drag.classList.remove('dragging');
        }

        const thisId = parseInt(drag.querySelector('.blockid').value, 10);
        if (thisId === 0 && rearrange) {
          drag.classList.remove('dragging');
          rearrange = false;

          for (let i = 0; i < tmpBlocks.length; i += 1) {
            if (tmpBlocks[i].id !== thisId) {
              const blockElement = document.querySelector(`.blockid[value="${tmpBlocks[i].id}"]`).parentNode;
              const arrowBlock = document.querySelector(`.arrowid[value="${tmpBlocks[i].id}"]`).parentNode;

              blockElement.style.left = `${(blockElement.getBoundingClientRect().left + window.scrollX) - (canvasDiv.getBoundingClientRect().left + window.scrollX) + canvasDiv.scrollLeft}px`;
              blockElement.style.top = `${(blockElement.getBoundingClientRect().top + window.scrollY) - (canvasDiv.getBoundingClientRect().top + window.scrollY) + canvasDiv.scrollTop}px`;
              arrowBlock.style.left = `${(arrowBlock.getBoundingClientRect().left + window.scrollX) - (canvasDiv.getBoundingClientRect().left + window.scrollX) + canvasDiv.scrollLeft}px`;
              arrowBlock.style.top = `${(arrowBlock.getBoundingClientRect().top + window.scrollY) - (canvasDiv.getBoundingClientRect().top + canvasDiv.scrollTop)}px`;

              canvasDiv.appendChild(blockElement);
              canvasDiv.appendChild(arrowBlock);

              tmpBlocks[i].x = (blockElement.getBoundingClientRect().left + window.scrollX) + (parseInt(blockElement.offsetWidth, 10) / 2) + canvasDiv.scrollLeft;
              tmpBlocks[i].y = (blockElement.getBoundingClientRect().top + window.scrollY) + (parseInt(blockElement.offsetHeight, 10) / 2) + canvasDiv.scrollTop;
            }
          }

          tmpBlocks.filter(block => (block.id === 0))[0].x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width, 10) / 2);
          tmpBlocks.filter(block => (block.id === 0))[0].y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height, 10) / 2);
          blocks = blocks.concat(tmpBlocks);
          tmpBlocks = [];
        // first block in the canvas
        } else if (dragging && blocks.length === 0 && (drag.getBoundingClientRect().top + window.scrollY) > (canvasDiv.getBoundingClientRect().top + window.scrollY) && (drag.getBoundingClientRect().left + window.scrollX) > (canvasDiv.getBoundingClientRect().left + window.scrollX)) {
          // emit the onSnap event
          blockSnap(drag, true, undefined);
          dragging = false;

          drag.style.top = `${(drag.getBoundingClientRect().top + window.scrollY) - (canvasDiv.getBoundingClientRect().top + window.scrollY) + canvasDiv.scrollTop}px`;
          drag.style.left = `${(drag.getBoundingClientRect().left + window.scrollX) - (canvasDiv.getBoundingClientRect().left + window.scrollX) + canvasDiv.scrollLeft}px`;

          canvasDiv.appendChild(drag);

          blocks.push({
            parent: -1,
            childwidth: 0,
            id: thisId,
            x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width, 10) / 2) + canvasDiv.scrollLeft,
            y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height, 10) / 2) + canvasDiv.scrollTop,
            width: parseInt(window.getComputedStyle(drag).width, 10),
            height: parseInt(window.getComputedStyle(drag).height, 10),
          });
        } else if (dragging && blocks.length === 0) {
          canvasDiv.appendChild(document.querySelector('.indicator'));
          drag.parentNode.removeChild(drag);
        } else if (dragging || rearrange) {
          const xPos = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width, 10) / 2) + canvasDiv.scrollLeft;
          const yPos = (drag.getBoundingClientRect().top + window.scrollY) + canvasDiv.scrollTop
          const blockIds = blocks.map(block => block.id);

          for (let i = 0; i < blocks.length; i += 1) {
            const self = blocks.filter(block => (block.id === blockIds[i]))[0];
            const x = self.x;
            const y = self.y;
            const width = self.width;
            const height = self.height;
            if (xPos >= x - (width / 2) - paddingX && xPos <= x + (width / 2) + paddingX && yPos >= y - (height / 2) && yPos <= y + height) {
              dragging = false;

              // emit the onSnap event
              if (!rearrange && blockSnap(drag, false, blocks.filter(block => (block.id === blockIds[i]))[0])) {
                snap(drag, i, blockIds);
              } else if (rearrange) {
                snap(drag, i, blockIds);
              }

              break;
            } else if (i === blocks.length - 1) {
              if (rearrange) {
                rearrange = false;
                tmpBlocks = [];
              }

              dragging = false;
              canvasDiv.appendChild(document.querySelector('.indicator'));
              drag.parentNode.removeChild(drag);
            }
          }
        }
      }
    }

    function touchDone() {
      dragBlock = false;
    }

    function snap(drag, i, blockIds) {
      if (!rearrange) {
        canvasDiv.appendChild(drag);
      }

      const thisId = parseInt(drag.querySelector('.blockid').value, 10);
      const childBlocks = blocks.filter(block => (block.parent === blockIds[i]));

      let totalwidth = 0;
      let totalremove = 0;

      for (let w = 0; w < childBlocks.length; w += 1) {
        const childBlock = childBlocks[w];
        if (childBlock.childwidth > childBlock.width) {
          totalwidth += childBlock.childwidth + paddingX;
        } else {
          totalwidth += childBlock.width + paddingX;
        }
      }
      totalwidth += parseInt(window.getComputedStyle(drag).width, 10);

      for (let w = 0; w < childBlocks.length; w += 1) {
        const childBlock = childBlocks[w];
        if (childBlock.childwidth > childBlock.width) {
          document.querySelector(`.blockid[value="${childBlock.id}"]`).parentNode.style.left = `${blocks.filter(block => (block.id === blockIds[i]))[0].x - (totalwidth / 2) + totalremove + (childBlock.childwidth / 2) - (childBlock.width / 2)}px`;
          childBlock.x = childBlocks[0].x - (totalwidth / 2) + totalremove + (childBlock.childwidth / 2);
          totalremove += childBlock.childwidth + paddingX;
        } else {
          document.querySelector(`.blockid[value="${childBlock.id}"]`).parentNode.style.left = `${blocks.filter(block => (block.id === blockIds[i]))[0].x - (totalwidth / 2) + totalremove}px`;
          childBlock.x = childBlocks[0].x - (totalwidth / 2) + totalremove + (childBlock.width / 2);
          totalremove += childBlock.width + paddingX;
        }
      }

      drag.style.left = `${blocks.filter(block => (block.id === blockIds[i]))[0].x - (totalwidth / 2) + totalremove - (canvasDiv.getBoundingClientRect().left + window.scrollX) + canvasDiv.scrollLeft}px`;
      drag.style.top = `${blocks.filter(block => (block.id === blockIds[i]))[0].y + (blocks.filter(block => (block.id === blockIds[i]))[0].height / 2) + paddingY - (canvasDiv.getBoundingClientRect().top + window.scrollY)}px`;

      if (rearrange) {
        const self = tmpBlocks.filter(block => (block.id === thisId))[0];
        self.x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width, 10) / 2) + canvasDiv.scrollLeft + canvasDiv.scrollLeft;
        self.y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height, 10) / 2) + canvasDiv.scrollTop;
        self.parent = blockIds[i];

        for (let w = 0; w < tmpBlocks.length; w += 1) {
          if (tmpBlocks[w].id !== thisId) {
            const blockElement = document.querySelector(`.blockid[value="${tmpBlocks[w].id}"]`).parentNode;
            const arrowBlock = document.querySelector(`.arrowid[value="${tmpBlocks[w].id}"]`).parentNode;

            blockElement.style.left = `${(blockElement.getBoundingClientRect().left + window.scrollX) - (canvasDiv.getBoundingClientRect().left + window.scrollX) + canvasDiv.scrollLeft}px`;
            blockElement.style.top = `${(blockElement.getBoundingClientRect().top + window.scrollY) - (canvasDiv.getBoundingClientRect().top + window.scrollY) + canvasDiv.scrollTop}px`;
            arrowBlock.style.left = `${(arrowBlock.getBoundingClientRect().left + window.scrollX) - (canvasDiv.getBoundingClientRect().left + window.scrollX) + canvasDiv.scrollLeft + 20}px`;
            arrowBlock.style.top = `${(arrowBlock.getBoundingClientRect().top + window.scrollY) - (canvasDiv.getBoundingClientRect().top + window.scrollY) + canvasDiv.scrollTop}px`;

            canvasDiv.appendChild(blockElement);
            canvasDiv.appendChild(arrowBlock);

            tmpBlocks[w].x = (blockElement.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(blockElement).width, 10) / 2) + canvasDiv.scrollLeft;
            tmpBlocks[w].y = (blockElement.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(blockElement).height, 10) / 2) + canvasDiv.scrollTop;
          }
        }
        blocks = blocks.concat(tmpBlocks);
        tmpBlocks = [];
      } else {
        blocks.push({
          childwidth: 0,
          parent: blockIds[i],
          id: thisId,
          x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width, 10) / 2) + canvasDiv.scrollLeft,
          y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height, 10) / 2) + canvasDiv.scrollTop,
          width: parseInt(window.getComputedStyle(drag).width, 10),
          height: parseInt(window.getComputedStyle(drag).height, 10),
        });
      }

      const arrowHelp = blocks.filter(block => (block.id === thisId))[0];
      const arrowX = arrowHelp.x - blocks.filter(block => (block.id === blockIds[i]))[0].x + 20;
      const arrowY = parseFloat(arrowHelp.y - (arrowHelp.height / 2) - (blocks.filter(block => (block.parent === blockIds[i]))[0].y + (blocks.filter(block => (block.parent === blockIds[i]))[0].height / 2)) + canvasDiv.scrollTop);

      if (arrowX < 0) {
        canvasDiv.innerHTML += `<div class="arrowblock"><input type="hidden" class="arrowid" value="${thisId}"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M${(blocks.filter(block => (block.id === blockIds[i]))[0].x - arrowHelp.x + 5)} 0L${(blocks.filter(block => (block.id === blockIds[i]))[0].x - arrowHelp.x + 5)} ${(paddingY / 2)}L5 ${(paddingY / 2)}L5 ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ${(arrowY - 5)}H10L5 ${arrowY}L0 ${(arrowY - 5)}Z" fill="#C5CCD0"/></svg></div>`;
        document.querySelector(`.arrowid[value="${thisId}"]`).parentNode.style.left = `${(arrowHelp.x - 5) - (canvasDiv.getBoundingClientRect().left + window.scrollX) + canvasDiv.scrollLeft}px`;
      } else {
        canvasDiv.innerHTML += `<div class="arrowblock"><input type="hidden" class="arrowid" value="${thisId}"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ${(paddingY / 2)}L${(arrowX)} ${(paddingY / 2)}L${arrowX} ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/><path d="M${(arrowX - 5)} ${(arrowY - 5)}H${(arrowX + 5)}L${arrowX} ${arrowY}L${(arrowX - 5)} ${(arrowY - 5)}Z" fill="#C5CCD0"/></svg></div>`;
        document.querySelector(`.arrowid[value="${thisId}"]`).parentNode.style.left = `${blocks.filter(block => (block.id === blockIds[i]))[0].x - 20 - (canvasDiv.getBoundingClientRect().left + window.scrollX) + canvasDiv.scrollLeft}px`;
      }
      document.querySelector(`.arrowid[value="${thisId}"]`).parentNode.style.top = `${blocks.filter(block => (block.id === blockIds[i]))[0].y + (blocks.filter(block => (block.id === blockIds[i]))[0].height / 2)}px`;

      if (blocks.filter(block => (block.id === blockIds[i]))[0].parent !== -1) {
        let flag = false;
        let idval = blockIds[i];

        while (!flag) {
          if (blocks.filter(block => (block.id === idval))[0].parent === -1) {
            flag = true;
          } else {
            let zwidth = 0;
            const childBlocks = blocks.filter(block => (block.parent === idval));
            for (let w = 0; w < childBlocks.length; w += 1) {
                const childBlock = childBlocks[w];
                if (childBlock.childwidth > childBlock.width) {
                    if (w === childBlocks.length - 1) {
                        zwidth += childBlock.childwidth;
                    } else {
                        zwidth += childBlock.childwidth + paddingX;
                    }
                } else {
                    if (w === childBlocks.length - 1) {
                        zwidth += childBlock.width;
                    } else {
                        zwidth += childBlock.width + paddingX;
                    }
                }
            }
            blocks.filter(block => (block.id === idval))[0].childwidth = zwidth;
            idval = blocks.filter(block => (block.id === idval))[0].parent;
          }
        }
        blocks.filter(block => (block.id === idval))[0].childwidth = totalwidth;
      }

      if (rearrange) {
        rearrange = false;
        drag.classList.remove('dragging');
      }

      rearrangeMe();
      checkOffset();
    }

    function hasParentClass(element, classname) {
      if (element.className) {
        if (element.className.split(' ').indexOf(classname) !== -1) {
          return true;
        }
      }
      return element.parentNode && hasParentClass(element.parentNode, classname);
    }

    function pageX(element){
      return element.offsetParent ? element.offsetLeft + pageX(element.offsetParent) : element.offsetLeft;
    }

    function pageY(element){
      return element.offsetParent ? element.offsetTop + pageY(element.offsetParent) : element.offsetTop;
    }

    function checkOffset() {
      const xArray = blocks.map(block => block.x);
      const widthArray = blocks.map(block => block.width);
      const tmp = xArray.map((x, i) => (x - (widthArray[i] / 2)));

      offsetLeft = Math.min.apply(Math, tmp);
      if (offsetLeft < (canvasDiv.getBoundingClientRect().left + window.scrollX)) {
        lastEvent = true;
        const blockIds = blocks.map(block => block.id);

        for (let w = 0; w < blocks.length; w += 1) {
          const self = blocks.filter(block => (block.id === blockIds[w]))[0];
          document.querySelector(`.blockid[value="${self.id}"]`).parentNode.style.left = `${self.x - (self.width / 2) - offsetLeft + 20}px`;
          if (self.parent !== -1) {
            const arrowHelp = self;
            const arrowX = arrowHelp.x - blocks.filter(block => (block.id === self.parent))[0].x;
            if (arrowX < 0) {
              document.querySelector(`.arrowid[value="${blockIds[w]}"]`).parentNode.style.left = `${(arrowHelp.x - offsetLeft + 20 - 5)}px`;
            } else {
              document.querySelector(`.arrowid[value="${blockIds[w]}"]`).parentNode.style.left = `${blocks.filter(block => (block.id === self.parent))[0].x - 20 - offsetLeft + 20}px`;
            }
          }
        }

        for (let w = 0; w < blocks.length; w += 1) {
          blocks[w].x = (document.querySelector(`.blockid[value="${blocks[w].id}"]`).parentNode.getBoundingClientRect().left + window.scrollX) + (canvasDiv.getBoundingClientRect().left + canvasDiv.scrollLeft) - (parseInt(window.getComputedStyle(document.querySelector(`.blockid[value="${blocks[w].id}"]`).parentNode).width) / 2) - 40;
        }

        offsetLeftOld = offsetLeft;
      }
    }

    function fixOffset() {
      if (offsetLeftOld < (canvasDiv.getBoundingClientRect().left + window.scrollX)) {
        lastEvent = false;
        const blockIds = blocks.map(block => block.id);

        for (let w = 0; w < blocks.length; w += 1) {
          const self = blocks.filter(block => (block.id === blockIds[w]))[0];
          document.querySelector(`.blockid[value="${self.id}"]`).parentNode.style.left = `${self.x - (self.width / 2) - offsetLeftOld - 20}px`;
          self.x = (document.querySelector(`.blockid[value="${self.id}"]`).parentNode.getBoundingClientRect().left + window.scrollX) + (self.width / 2);

          if (self.parent !== -1) {
            const arrowHelp = self;
            const arrowX = arrowHelp.x - blocks.filter(block => (block.id === self.parent))[0].x;
            if (arrowX < 0) {
              document.querySelector(`.arrowid[value="${blockIds[w]}"]`).parentNode.style.left = `${arrowHelp.x - 5 - (canvasDiv.getBoundingClientRect().left + window.scrollX)}px`;
            } else {
              document.querySelector(`.arrowid[value="${blockIds[w]}"]`).parentNode.style.left = `${blocks.filter(block => (block.id === self.parent))[0].x - 20 - (canvasDiv.getBoundingClientRect().left + window.scrollX)}px`;
            }
          }
        }

        offsetLeftOld = 0;
      }
    }

    function rearrangeMe() {
      const parentIds = blocks.map(block => block.parent);

      for (let z = 0; z < parentIds.length; z += 1) {
        if (parentIds[z] === -1) {
          z += 1;
        }

        const childBlocks = blocks.filter(block => (block.parent === parentIds[z]));

        let totalwidth = 0;
        let totalremove = 0;

        // calculate needed width for children of this childBlock
        for (let w = 0; w < childBlocks.length; w += 1) {
          const childBlock = childBlocks[w];

          // no any of children belonging to this childBlock
          if (blocks.filter(block => (block.parent === childBlock.id)).length === 0) {
            childBlock.childwidth = 0;
          }

          if (childBlock.childwidth > childBlock.width) {
            if (w === childBlocks.length - 1) {
              totalwidth += childBlock.childwidth;
            } else {
              totalwidth += childBlock.childwidth + paddingX;
            }
          } else {
            if (w === childBlocks.length - 1) {
              totalwidth += childBlock.width;
            } else {
              totalwidth += childBlock.width + paddingX;
            }
          }
        }

        if (parentIds[z] !== -1) {
          blocks.filter(block => (block.id === parentIds[z]))[0].childwidth = totalwidth;
        }

        for (let w = 0; w < childBlocks.length; w += 1) {
          const childBlock = childBlocks[w];
          const blockElement = document.querySelector(`.blockid[value="${childBlock.id}"]`).parentNode;
          const thisBlocks = blocks.filter(block => (block.id === parentIds[z]));

          blockElement.style.top = `${thisBlocks.y + paddingY}px`;
          thisBlocks.y = thisBlocks.y + paddingY;

          if (childBlock.childwidth > childBlock.width) {
            blockElement.style.left = `${thisBlocks[0].x - (totalwidth / 2) + totalremove + (childBlock.childwidth / 2) - (childBlock.width / 2) - (canvasDiv.getBoundingClientRect().left + window.scrollX)}px`;
            childBlock.x = thisBlocks[0].x - (totalwidth / 2) + totalremove + (childBlock.childwidth / 2);
            totalremove += childBlock.childwidth + paddingX;
          } else {
            blockElement.style.left = `${thisBlocks[0].x - (totalwidth / 2) + totalremove - (canvasDiv.getBoundingClientRect().left + window.scrollX)}px`;
            childBlock.x = thisBlocks[0].x - (totalwidth / 2) + totalremove + (childBlock.width / 2);
            totalremove += childBlock.width + paddingX;
          }

          const arrowHelp = blocks.filter(block => (block.id === childBlock.id))[0];
          const arrowX = arrowHelp.x - blocks.filter(block => (block.id === childBlock.parent))[0].x + 20;
          const arrowY = arrowHelp.y - (arrowHelp.height / 2) - (blocks.filter(block => (block.id === childBlock.parent))[0].y + (blocks.filter(block => (block.id === childBlock.parent))[0].height / 2));

          document.querySelector(`.arrowid[value="${childBlock.id}"]`).parentNode.style.top = `${blocks.filter(block => (block.id === childBlock.parent))[0].y + (blocks.filter(block => (block.id === childBlock.parent))[0].height / 2) - (canvasDiv.getBoundingClientRect().top + window.scrollY)}px`;
          if (arrowX < 0) {
            document.querySelector(`.arrowid[value="${childBlock.id}"]`).parentNode.style.left = `${(arrowHelp.x - 5) - (canvasDiv.getBoundingClientRect().left + window.scrollX)}px`;
            document.querySelector(`.arrowid[value="${childBlock.id}"]`).parentNode.innerHTML = `<input type="hidden" class="arrowid" value="${childBlock.id}"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M${(blocks.filter(block => (block.id === childBlock.parent))[0].x - arrowHelp.x + 5)} 0L${(blocks.filter(block => (block.id === childBlock.parent))[0].x - arrowHelp.x + 5)} ${(paddingY / 2)}L5 ${(paddingY / 2)}L5 ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ${(arrowY - 5)}H10L5 ${arrowY}L0 ${(arrowY - 5)}Z" fill="#C5CCD0"/></svg>`;
          } else {
            document.querySelector(`.arrowid[value="${childBlock.id}"]`).parentNode.style.left = `${blocks.filter(block => (block.id === childBlock.parent))[0].x - 20 - (canvasDiv.getBoundingClientRect().left + window.scrollX)}px`;
            document.querySelector(`.arrowid[value="${childBlock.id}"]`).parentNode.innerHTML = `<input type="hidden" class="arrowid" value="${childBlock.id}"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ${(paddingY / 2)}L${(arrowX)} ${(paddingY / 2)}L${arrowX} ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/><path d="M${(arrowX - 5)} ${(arrowY - 5)}H${(arrowX + 5)}L${arrowX} ${arrowY}L${(arrowX - 5)} ${(arrowY - 5)}Z" fill="#C5CCD0"/></svg>`;
          }
        }
      }
    }

    document.addEventListener('mousedown', beginDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('mousedown', touchblock);
    document.addEventListener('mouseup', touchDone);
    document.addEventListener('mousemove', moveBlock);
  }

  flowy.load();
};

export default flowy;
