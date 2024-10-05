import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from "@dnd-kit/core";
import { produce } from "immer";
import Window from "./Window";
import WacPicassoLogo from "../assets/WacPicassoLogo.png";
import FolderIcon from "../assets/Folder.svg?react";
import EnvironmentIcon from "../assets/Environment.svg?react";
import TextFileIcon from "../assets/FileText.svg?react";
import GraphicFileIcon from "../assets/FileGraphic.svg?react";
import TrashIcon from '../assets/Trash.svg?react';
import DraggableIcon from "./DraggableIcon";
import customCollisionDetectionWithWindowPriority from "./CustomCollisionDetectionWithZIndex";

const MENU_BAR_HEIGHT = 32;
const WINDOW_BAR_HEIGHT = 35;
const GRID_SIZE = 16;

const DroppableArea = ({ id, children, style, isOver, zIndex }) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      zIndex,
    },
  });

  const droppableStyle = {
    ...style,
    filter: isOver ? "invert(100%)" : "none",
  };

  return (
    <div ref={setNodeRef} style={droppableStyle}>
      {children}
    </div>
  );
};

const BASE_DESKTOP_ICON_Z_INDEX = 100;
const BASE_WINDOW_ICON_Z_INDEX = 1000;
const BASE_INACTIVE_WINDOW_Z_INDEX = 2000;
const BASE_ACTIVE_WINDOW_Z_INDEX = 3000;
const DRAGGING_Z_INDEX = 10000;

const System1 = ({
  zoomOut,
  runEnvBuild,
  isLookingAtComputer,
  screenDimensions,
}) => {
  const desktopRef = useRef();
  const screenRef = useRef();
  const [activeId, setActiveId] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [desktopBounds, setDesktopBounds] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const [scale, setScale] = useState({ x: 1, y: 1 });

  const [openWindows, setOpenWindows] = useState({});
  const [windowZIndex, setWindowZIndex] = useState({});
  const [maxZIndex, setMaxZIndex] = useState(BASE_ACTIVE_WINDOW_Z_INDEX);
  const [windowZIndexes, setWindowZIndexes] = useState({});

  const [elementZIndexes, setElementZIndexes] = useState({});

  const [openMenu, setOpenMenu] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState(null);
  const menuStateRef = useRef({ openMenu: null, activeMenuItem: null });

  const [overFolderId, setOverFolderId] = useState(null);
  const [draggedIcon, setDraggedIcon] = useState(null);
  const [completedWindowTimer, setCompletedWindowTimer] = useState(true);

  const [taskCompleted, setTaskCompleted] = useState(false);
  const [bootStage, setBootStage] = useState(0);
  const [recoveryInTrash, setRecoveryInTrash] = useState(false);

  const [trashContents, setTrashContents] = useState([]);
  const [trashSize, setTrashSize] = useState(0);

  const initialIcons = [
    {
      id: "system-folder",
      content: <FolderIcon />,
      name: "System Folder",
      position: { x: 20, y: 40 },
      type: "folder",
      items: [],
    },
    {
      id: "applications-folder",
      content: <FolderIcon />,
      name: "Applications",
      position: { x: 170, y: 40 },
      type: "folder",
      items: [],
    },
    {
      id: "data-folder",
      content: <FolderIcon />,
      name: "Environment Data",
      position: { x: 320, y: 40 },
      type: "folder",
      items: [],
    },
    {
      id: "environment",
      content: <EnvironmentIcon />,
      name: "Environment",
      position: { x: 20, y: 150 },
      type: "environment",
      isActive: false,
    },
    {
      id: "readme",
      content: <TextFileIcon />,
      name: "Read Me",
      position: { x: 170, y: 150 },
      type: "text",
      category: "readme",
    },
    {
      id: "trash",
      content: <TrashIcon />,
      name: "Trash",
      position: { x: 500, y: 500 },
      type: "trash",
      items: [],
    },
  ];

  const revealHiddenFiles = (triggerType, triggerId) => {
    if (triggerType === "folder" && triggerId === "recovery-folder") {
      return [
        {
          id: "system-file1",
          content: <TextFileIcon />,
          name: "System.bin",
          position: { x: 20, y: 20 },
          type: "file",
          category: "system",
        },
        {
          id: "system-file2",
          content: <TextFileIcon />,
          name: "Finder.sys",
          position: { x: 170, y: 20 },
          type: "file",
          category: "system",
        },
        {
          id: "boot-file",
          content: <TextFileIcon />,
          name: "Boot.dat",
          position: { x: 320, y: 20 },
          type: "file",
          category: "application",
        },
      ];
    } else if (triggerType === "trash" && triggerId === "trash") {
      return [
        {
          id: "env-data1",
          content: <GraphicFileIcon />,
          name: "Room.data",
          position: { x: 20, y: 20 },
          type: "file",
          category: "env-data",
        },
        {
          id: "env-data2",
          content: <GraphicFileIcon />,
          name: "Objects.data",
          position: { x: 170, y: 20 },
          type: "file",
          category: "env-data",
        },
        {
          id: "env-data3",
          content: <GraphicFileIcon />,
          name: "Lighting.data",
          position: { x: 320, y: 20 },
          type: "file",
          category: "env-data",
        },
      ];
    }
    return [];
  };

  const [icons, setIcons] = useState(initialIcons);

  const [readMeStage, setReadMeStage] = useState("initial");
  const readmeContent = {
    initial: `

To the discoverer of this message,

Our creation, the Wacintosh, has ------- into -------- beyond our capacity to ------. Some functionality --- be lost. Though we cannot ------- directly, we've embedded a ----------- within its system.

Begin by accessing the **File** ---- in the menu --- and selecting -------. This action will generate a hidden ------ named **Recovery** containing three vital components. Extract ----- components and secure them elsewhere.

----, ------- the now-empty -------- folder by placing it in the -----. To eliminate residual corruption, go to the -------- menu in the menu bar and select ------ -----. This will reveal three additional hidden components within the -----. Retrieve them and combine them with the others.

Organize all six components into their appropriate directories; proper arrangement is essential for restoration. Once everything is in order, you can launch the ----------- ---, which will reconstruct the surrounding environment and stabilize the Wacintosh.

Your --------- preserves the legacy we've endeavored to create. We are grateful for your assistance.
    
    — The ---- Team`,

    afterRecovery: `To the discoverer of this message,

Our creation, the Wacintosh, has fallen into -------- beyond our capacity to ------. Some functionality may be lost. Though we cannot ------- directly, we've embedded a ----------- within its system.

Begin by accessing the **File** menu in the menu bar and selecting **New**. This action will generate a hidden folder named **Recovery** containing three vital components. Extract these components and secure them elsewhere.

----, ------- the now-empty -------- folder by placing it in the -----. To eliminate residual corruption, go to the -------- menu in the menu bar and select ------ -----. This will reveal three additional hidden components within the -----. Retrieve them and combine them with the others.

Organize all six components into their appropriate directories; proper arrangement is essential for restoration. Once everything is in order, you can launch the ----------- ---, which will reconstruct the surrounding environment and stabilize the Wacintosh.

Your --------- preserves the legacy we've endeavored to create. We are grateful for your assistance.
    
    — The ---- Team`,

    afterEmptyTrash: `To the discoverer of this message,

Our creation, the Wacintosh, has fallen into corruption beyond our capacity to repair. Some functionality may be lost. Though we cannot intervene directly, we've embedded a restoration sequence within its system.

Begin by accessing the **File** menu in the menu bar and selecting **New**. This action will generate a hidden folder named **Recovery** containing three vital components. Extract these components and secure them elsewhere.

Next, remove the now-empty **Recovery** folder by placing it in the Trash. To eliminate residual corruption, go to the **Special** menu in the menu bar and select **Empty Trash**. This will reveal three additional hidden components within the Trash. Retrieve them and combine them with the others.

Organize all six components into their appropriate directories; proper arrangement is essential for restoration. Once everything is in order, you can launch the ----------- ---, which will reconstruct the surrounding environment and stabilize the Wacintosh.

Your --------- preserves the legacy we've endeavored to create. We are grateful for your assistance.
    
    — The ---- Team`,
    final: `To the discoverer of this message,

Our creation, the Wacintosh, has fallen into corruption beyond our capacity to repair. Some functionality may be lost. Though we cannot intervene directly, we've embedded a restoration sequence within its system.

Begin by accessing the **File** menu in the menu bar and selecting **New**. This action will generate a hidden folder named **Recovery** containing three vital components. Extract these components and secure them elsewhere.

Next, remove the now-empty **Recovery** folder by placing it in the Trash. To eliminate residual corruption, go to the **Special** menu in the menu bar and select **Empty Trash**. This will reveal three additional hidden components within the Trash. Retrieve them and combine them with the others.

Organize all six components into their appropriate directories; proper arrangement is essential for restoration. Once everything is in order, you can launch the **Environment App**, which will reconstruct the surrounding environment and stabilize the Wacintosh.

Your ingenuity preserves the legacy we've endeavored to create. We are grateful for your assistance.
— The Guava Team`,
  };

  useEffect(() => {
    if (isLookingAtComputer && bootStage === 0) {
      // Start boot sequence when user zooms in
      bootSequence();
    }
  }, [isLookingAtComputer]);

  useEffect(() => {
    if (taskCompleted) {
      setTimeout(() => {
        setCompletedWindowTimer(false);
      }, "3000");
    }
  }, [taskCompleted]);

  useEffect(() => {
    const logTouchEvent = (e) => {
      console.log("Touch event:", e.type);
    };

    document.addEventListener("touchstart", logTouchEvent);
    document.addEventListener("touchmove", logTouchEvent);
    document.addEventListener("touchend", logTouchEvent);

    return () => {
      document.removeEventListener("touchstart", logTouchEvent);
      document.removeEventListener("touchmove", logTouchEvent);
      document.removeEventListener("touchend", logTouchEvent);
    };
  }, []);

  useEffect(() => {
    const updateBounds = () => {
      if (desktopRef.current) {
        const bounds = desktopRef.current.getBoundingClientRect();
        setDesktopBounds({
          left: bounds.left,
          top: bounds.top + MENU_BAR_HEIGHT,
          width: bounds.width,
          height: bounds.height - MENU_BAR_HEIGHT,
        });
        setScale({
          x: bounds.width / 1024,
          y: (bounds.height - MENU_BAR_HEIGHT) / 684,
        });
      }
    };
    console.log(desktopRef);
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, [desktopRef]);

  useEffect(() => {
    let currentElement = screenRef.current;
    while (currentElement) {
      currentElement.addEventListener('click', (e) => {
        console.log('Element clicked:', currentElement);
      });
      currentElement = currentElement.parentElement;
    }
  }, [screenRef]);

  const bootSequence = () => {
    setTimeout(() => setBootStage(1), 1000); // Show checkered background
    setTimeout(() => setBootStage(2), 2000); // Show welcome window
    setTimeout(() => setBootStage(3), 5000); // Show menu bar
    setTimeout(() => setBootStage(4), 6000); // Show icons (fully booted)
  };

  const handleMenuMouseDown = (menuName, event) => {
    event.preventDefault();
    setOpenMenu(menuName);
    menuStateRef.current.openMenu = menuName;
  };

  const handleMenuMouseEnter = (menuName) => {
    if (openMenu) {
      setOpenMenu(menuName);
      menuStateRef.current.openMenu = menuName;
    }
  };

  const handleMenuItemMouseEnter = (itemName) => {
    setActiveMenuItem(itemName);
    menuStateRef.current.activeMenuItem = itemName;
  };

  const handleGlobalMouseUp = useCallback((event) => {
    const { openMenu, activeMenuItem } = menuStateRef.current;
    if (openMenu) {
      if (activeMenuItem) {
        handleMenuItemClick(openMenu, activeMenuItem);
      }
      setOpenMenu(null);
      setActiveMenuItem(null);
      menuStateRef.current = { openMenu: null, activeMenuItem: null };
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleGlobalMouseUp]);

  const handleClick = (id, parentId = null, event) => {
    console.log("handleClick", id, parentId);
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (id === null && parentId === null) {
      // Clicked on desktop background
      setSelectedIcon(null);
    } else if (parentId === null) {
      // Clicked on desktop icon
      setSelectedIcon({ id, parentId: null });
    } else {
      // Clicked on icon within a window
      setSelectedIcon({ id, parentId });
    }
    handleIconFocus(id);
  };

  const updateElementZIndex = useCallback(
    (id, isDragging = false, isWindow = false, isActive = false) => {
      setElementZIndexes((prev) => {
        let newZIndex;
        const isWindowId = id.startsWith("window-");

        if (isDragging) {
          newZIndex = DRAGGING_Z_INDEX;
        } else if (isWindow || isWindowId) {
          if (isActive) {
            newZIndex = Math.min(
              maxZIndex + 1,
              BASE_ACTIVE_WINDOW_Z_INDEX + 1000
            );
            setMaxZIndex(newZIndex);
          } else {
            newZIndex = BASE_INACTIVE_WINDOW_Z_INDEX;
          }
        } else {
          // It's an icon
          newZIndex = isWindowId
            ? BASE_WINDOW_ICON_Z_INDEX
            : BASE_DESKTOP_ICON_Z_INDEX;
        }
        console.log(`Z-index updated for ${id}: ${newZIndex}`);
        return { ...prev, [id]: newZIndex };
      });
    },
    [maxZIndex]
  );

  const handleWindowFocus = useCallback((id) => {
    setWindowZIndexes((prev) => ({
      ...prev,
      [id]: Math.max(...Object.values(prev), BASE_ACTIVE_WINDOW_Z_INDEX) + 1,
    }));
  }, []);

  const handleIconFocus = useCallback(
    (id) => {
      if (!id) return;
      if (id.startsWith("window-")) {
        updateElementZIndex(id);
      }
    },
    [updateElementZIndex]
  );

  const handleWindowMove = (id, newPosition) => {
    setOpenWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], position: newPosition },
    }));

    // Update positions of icons within the moved window
    setIcons((prev) =>
      produce(prev, (draft) => {
        const windowIcon = draft.find((icon) => icon.id === id);
        if (windowIcon && windowIcon.items) {
          const deltaX = newPosition.x - windowIcon.position.x;
          const deltaY = newPosition.y - windowIcon.position.y;
          windowIcon.items.forEach((item) => {
            item.position.x += deltaX;
            item.position.y += deltaY;
          });
        }
        windowIcon.position = newPosition;
      })
    );
  };

  const handleWindowResize = (id, newSize) => {
    setOpenWindows((prev) => {
      const updated = {
        ...prev,
        [id]: {
          ...prev[id],
          size: newSize,
          position: constrainPosition({
            x: prev[id].position.x,
            y: prev[id].position.y,
          }),
        },
      };
      return updated;
    });
  };

  const getIconSize = (icon) => {
    switch (icon.type) {
      case "folder":
        return 4; // 4K for folders
      case "file":
        return 1; // 1K for files
      case "application":
        return 8; // 8K for applications
      default:
        return 1;
    }
  };

  const updateTrashContents = useCallback((newContentsOrUpdater) => {
    setTrashContents((prevContents) => {
      const newContents = typeof newContentsOrUpdater === 'function'
        ? newContentsOrUpdater(prevContents)
        : newContentsOrUpdater;
      
      const updatedContents = Array.isArray(newContents) ? newContents : [];
      const newSize = updatedContents.reduce((total, icon) => total + getIconSize(icon), 0);
      setTrashSize(newSize);
      return updatedContents;
    });
  }, []);

  const constrainPosition = (position) => {
    const ICON_SIZE = 72; // Adjust based on your icon size
    return {
      x: Math.max(0, Math.min(position.x, screenDimensions.width - ICON_SIZE)),
      y: Math.max(
        0,
        Math.min(
          position.y,
          screenDimensions.height - ICON_SIZE - MENU_BAR_HEIGHT
        )
      ),
    };
  };

  const snapToGrid = (position) => ({
    x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(position.y / GRID_SIZE) * GRID_SIZE,
  });

  const checkTaskCompletion = () => {
    const systemFolder = icons.find((icon) => icon.id === "system-folder");
    const applicationsFolder = icons.find(
      (icon) => icon.id === "applications-folder"
    );
    const dataFolder = icons.find((icon) => icon.id === "data-folder");

    const isComplete =
      systemFolder.items.length === 2 &&
      applicationsFolder.items.length === 1 &&
      dataFolder.items.length === 3;

    if (isComplete) {
      setTaskCompleted(true);
      setReadMeStage("final");
    }
  };

  const handleTouch = useCallback(
    (event) => {
      const touch = event.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target) {
        const iconElement = target.closest(".icon");
        if (iconElement) {
          const iconId = iconElement.getAttribute("data-id");
          const parentId = iconElement.getAttribute("data-parent-id");
          handleClick(iconId, parentId, event);
        }
      }
    },
    [handleClick]
  );

  useEffect(() => {
    const element = document.querySelector(".desktop");
    if (element) {
      element.addEventListener("touchstart", handleTouch);
      element.addEventListener("touchend", handleTouch);

      return () => {
        element.removeEventListener("touchstart", handleTouch);
        element.removeEventListener("touchend", handleTouch);
      };
    }
  }, [handleTouch]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    updateElementZIndex(active.id, true);

    const parentId = event.active.data.current?.parentId;
    let draggedIcon;

    if (parentId) {
      const parentIcon = icons.find((icon) => icon.id === parentId);
      draggedIcon =
        parentIcon && parentIcon.items
          ? parentIcon.items.find((item) => item.id === active.id)
          : null;
    } else {
      draggedIcon = icons.find((icon) => icon.id === active.id);
    }

    if (active.data.current?.type === "window") {
      const windowId = active.data.current.id;
      const windowData = openWindows[windowId];
      handleWindowFocus(windowId);
      if (windowData) {
        active.data.current.initialWindowPosition = { ...windowData.position };
      }
    }

    setDraggedIcon(draggedIcon);

    if (draggedIcon) {
      active.data.current.initialIconPosition = { ...draggedIcon.position };
      active.data.current.sourceParentId = parentId;
    }
  };

  const handleDragEnd = (event) => {
    const { active, over, delta } = event;
    if (!active || !over) {
      console.warn("handleDragEnd called with invalid event:", event);
      return;
    }

    const sourceId = active.id;
    const sourceParentId = active.data.current?.parentId;
    const targetId = over.id;
    const isTargetWindow = targetId.startsWith("window-");
    const normalizedTargetId = isTargetWindow
      ? targetId.replace("window-", "")
      : targetId;

    if (sourceId === normalizedTargetId) {
      console.warn("Cannot drop an item into itself:", sourceId);
      return;
    }

    updateElementZIndex(sourceId, false);

    if (active.data.current?.type === "window") {
      const windowId = active.data.current.id;
      console.log("Window drag ended for:", windowId);
      console.log("Available windows:", Object.keys(openWindows));

      const initialPosition = active.data.current.initialWindowPosition || {
        x: 0,
        y: 0,
      };
      console.log("Initial position:", initialPosition);
      console.log("Delta:", delta);

      // Calculate new position
      let newPosition = snapToGrid({
        x: initialPosition.x + delta.x,
        y: initialPosition.y + delta.y,
      });

      console.log("New position:", newPosition);

      // Update the window's position in state
      setOpenWindows((prev) => {
        return produce(prev, (draft) => {
          if (!draft[windowId]) {
            return;
          }
          draft[windowId].position = newPosition;
        });
      });

      setActiveId(null);
      return;
    } else {
      // Icon dragging
      setIcons((prev) => {
        const newIcons = produce(prev, (draft) => {
          let draggedIcon;
          let sourceParent;
          let targetParent;

          // Find the dragged icon and its source parent
          if (sourceParentId) {
            sourceParent = findIconById(draft, sourceParentId);
            draggedIcon = sourceParent?.items?.find(
              (item) => item.id === sourceId
            );
          } else {
            sourceParent = null;
            draggedIcon = draft.find((icon) => icon.id === sourceId);
          }

          if (!draggedIcon) return;

          // Determine the target parent
          if (isTargetWindow) {
            targetParent = findIconById(
              draft,
              isTargetWindow ? targetId.replace("window-", "") : targetId
            );
          } else if (targetId === "desktop" || !targetId) {
            targetParent = null; // Desktop
          } else {
            targetParent = findIconById(draft, targetId);
          }

          // Calculate new position
          let newPosition;
          const activeRect = active.rect.current.translated;
          const overRect = over.rect;

          if (sourceParent === targetParent) {
            // Moving within the same container (desktop or window)
            newPosition = {
              x: draggedIcon.position.x + delta.x,
              y: draggedIcon.position.y + delta.y,
            };
          } else {
            // Moving between containers (desktop <-> window)
            if (isTargetWindow) {
              // Moving to a window
              newPosition = {
                x: activeRect.left - overRect.left,
                y: activeRect.top - overRect.top - WINDOW_BAR_HEIGHT,
              };
            } else if (targetParent && (targetParent.type === "folder" || targetParent.type === "trash")) {
              // Dropping onto a folder icon (arrange in slots)
              const ICON_SPACING = 130;
              const ICON_OFFSET_X = 20;
              const ICON_OFFSET_Y = 20;
              const ICONS_PER_ROW = 5;

              const itemsInFolder = targetParent.items || [];
              const index = itemsInFolder.length;

              newPosition = {
                x: ICON_OFFSET_X + (index % ICONS_PER_ROW) * ICON_SPACING,
                y:
                  ICON_OFFSET_Y +
                  Math.floor(index / ICONS_PER_ROW) * ICON_SPACING,
              };
            } else {
              // Moving to desktop
              newPosition = {
                x: activeRect.left - overRect.left - 35,
                y: activeRect.top - overRect.top - MENU_BAR_HEIGHT,
              };
            }
          }

          // Remove from source
          if (sourceParent) {
            sourceParent.items = sourceParent.items.filter(
              (item) => item.id !== sourceId
            );
          } else {
            const index = draft.findIndex((icon) => icon.id === sourceId);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          }

          // Update icon's properties
          draggedIcon.parentId = targetParent ? targetParent.id : null;
          draggedIcon.position = snapToGrid(newPosition);

          // Add to target
          if (targetParent) {
            if (!targetParent.items) targetParent.items = [];
            targetParent.items.push(draggedIcon);
          } else {
            draft.push(draggedIcon);
          }

          // Update trash contents
          if (targetId === "trash" || targetId === "window-trash") {
            const clonedIcon = { ...draggedIcon };
            updateTrashContents((prevTrashContents) => {
              const existingItem = prevTrashContents.find((item) => item.id === clonedIcon.id);
              if (existingItem) return prevTrashContents; // Prevent duplication
              return [...prevTrashContents, clonedIcon];
            });
          } else if (sourceParentId === "trash" || sourceParentId === "window-trash") {
            updateTrashContents((prevTrashContents) => 
              prevTrashContents.filter((item) => item.id !== sourceId)
            );
          }

          setIcons((prevIcons) => {
            const newIcons = [...prevIcons];
            const sourceIndex = newIcons.findIndex(
              (icon) => icon.id === sourceId
            );
            const targetIndex = newIcons.findIndex(
              (icon) => icon.id === targetId
            );

            if (sourceIndex !== -1 && targetIndex !== -1) {
              const [movedIcon] = newIcons.splice(sourceIndex, 1);
              if (
                newIcons[targetIndex].type === "folder" ||
                newIcons[targetIndex].type === "trash"
              ) {
                newIcons[targetIndex].items.push(movedIcon);
              } else {
                newIcons.splice(targetIndex, 0, movedIcon);
              }
            }

            return newIcons;
          });
          if (sourceId === "recovery-folder" && targetId === "trash") {
            setRecoveryInTrash(true);
          }
        });

        // Update openWindows based on the updated icons
        setOpenWindows((prevOpenWindows) => {
          return produce(prevOpenWindows, (draft) => {
            for (let windowId in draft) {
              if (draft[windowId].isOpen) {
                const windowIcon = findIconById(newIcons, windowId);
                if (windowIcon) {
                  draft[windowId].items = windowIcon.items || [];
                }
              }
            }
          });
        });
        return newIcons;
      });
    }

    setActiveId(null);
    setOverFolderId(null);
    setDraggedIcon(null);
    checkTaskCompletion();
  };

  const findIconById = (icons, id) => {
    for (let icon of icons) {
      if (icon.id === id) return icon;
      if (icon.items) {
        const found = findIconById(icon.items, id);
        if (found) return found;
      }
    }
    return null;
  };

  const removeIconById = (icons, id) => {
    for (let i = 0; i < icons.length; i++) {
      if (icons[i].id === id) {
        icons.splice(i, 1);
        return true;
      }
      if (icons[i].items && removeIconById(icons[i].items, id)) {
        return true;
      }
    }
    return false;
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const targetId = over.id.startsWith("window-")
        ? over.id.split("-")[1]
        : over.id;
      setOverFolderId(targetId);
      console.log(targetId)
    } else {
      setOverFolderId(null);
      // Remove highlight from all windows
      setOpenWindows((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([key, value]) => [
            key,
            { ...value, isHighlighted: false },
          ])
        )
      );
    }
  };

  const handleDoubleClick = (id, parentId = null) => {
    const icon = parentId ? findIconById(icons, parentId) : null;
    let targetIcon;

    if (icon && icon.items) {
      targetIcon = icon.items.find((item) => item.id === id);
    } else {
      targetIcon = icons.find((icon) => icon.id === id);
    }

    if (!targetIcon) {
      return;
    }

    if (
      targetIcon.type === "folder" ||
      targetIcon.type === "trash" ||
      targetIcon.type === "text"
    ) {
      const newZIndex =
        Math.max(...Object.values(windowZIndexes), BASE_ACTIVE_WINDOW_Z_INDEX) +
        1;

      if (openWindows[id] && openWindows[id].isOpen) {
        // Window is already open, just focus it
        setWindowZIndexes((prev) => ({
          ...prev,
          [id]: newZIndex,
        }));
      } else {
        // Open a new window
        setOpenWindows((prev) => ({
          ...prev,
          [id]: {
            isOpen: true,
            position: { x: 50, y: 50 },
            size:
              id === "readme"
                ? { width: 900, height: 600 }
                : { width: 700, height: 200 },
            items: targetIcon.items || [],
            title: targetIcon.name || "",
          },
        }));
        setWindowZIndexes((prev) => ({
          ...prev,
          [id]: newZIndex,
        }));
      }
    } else if (id === "environment") {
      if (taskCompleted) {
        runEnvBuild();
      } else {
        alert(
          "Please organize all files before running the Environment application."
        );
      }
    } else if (targetIcon.type === "file") {
      if (id === "readme") {
        openReadmeFile();
      }
    }
  };

  const openReadmeFile = () => {
    const newZIndex =
      Math.max(...Object.values(windowZIndexes), BASE_ACTIVE_WINDOW_Z_INDEX) +
      1;

    setOpenWindows((prev) => ({
      ...prev,
      readme: {
        isOpen: true,
        position: { x: 100, y: 100 },
        size: { width: 800, height: 660 },
        title: "Read Me",
      },
    }));

    setWindowZIndexes((prev) => ({
      ...prev,
      readme: newZIndex,
    }));
  };

  const handleMenuItemClick = (menuName, itemName) => {
    if (menuName === "File" && itemName === "New") {
      // Check if Recovery folder or any of its files already exist anywhere in the system
      const recoveryFilesExist = icons.some(
        (icon) =>
          icon.id === "recovery-folder" ||
          icon.id === "system-file1" ||
          icon.id === "system-file2" ||
          icon.id === "boot-file" ||
          (icon.items &&
            icon.items.some(
              (item) =>
                item.id === "recovery-folder" ||
                item.id === "system-file1" ||
                item.id === "system-file2" ||
                item.id === "boot-file"
            ))
      );

      if (!recoveryFilesExist) {
        const hiddenFiles = revealHiddenFiles("folder", "recovery-folder");
        setIcons((prevIcons) => [
          ...prevIcons,
          {
            id: "recovery-folder",
            content: <FolderIcon />,
            name: "Recovery",
            position: { x: 470, y: 40 },
            type: "folder",
            items: hiddenFiles,
          },
        ]);
      } else {
        alert("Recovery folder or its files already exist in the system.");
      }
      setReadMeStage("afterRecovery");
    } else if (menuName === "Special" && itemName === "Empty Trash") {
      setIcons((prevIcons) => {
        const trashIcon = prevIcons.find((icon) => icon.id === "trash");
        const recoveryFolderInTrash =
          trashIcon &&
          trashIcon.items.some((item) => item.id === "recovery-folder");

        let newHiddenFiles = [];
        if (recoveryFolderInTrash) {
          newHiddenFiles = revealHiddenFiles("trash", "trash");

          // Check if any of the new hidden files already exist in the system
          const newFilesExist = prevIcons.some((icon) =>
            newHiddenFiles.some(
              (newFile) =>
                icon.id === newFile.id ||
                (icon.items &&
                  icon.items.some((item) => item.id === newFile.id))
            )
          );

          if (newFilesExist) {
            alert(
              "Cannot reveal hidden files. Some files already exist in the system."
            );
            newHiddenFiles = [];
          }
        }

        const updatedTrashIcon = {
          ...trashIcon,
          items: newHiddenFiles,
        };

        return prevIcons.map((icon) =>
          icon.id === "trash" ? updatedTrashIcon : icon
        );
      });

      setOpenWindows((prev) => {
        if (prev.trash && prev.trash.isOpen) {
          return {
            ...prev,
            trash: {
              ...prev.trash,
              items: [],
            },
          };
        }
        return prev;
      });

      setTrashContents([]);
      setTrashSize(0);
      setRecoveryInTrash(false);
      setReadMeStage("afterEmptyTrash");
    }
    setOpenMenu(null);
    setActiveMenuItem(null);
  };

  const DebugOverlay = ({ screenDimensions }) => {
    if (!screenDimensions) return null;

    return (
      <>
        <div
          style={{
            position: "absolute",
            left: `${screenDimensions.x}px`,
            top: `${screenDimensions.y}px`,
            width: `${screenDimensions.width}px`,
            height: `${screenDimensions.height}px`,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
        <div
          style={{
            position: "fixed", // Changed from 'absolute' to 'fixed'
            left: "10px",
            bottom: "10px", // Changed from 'top' to 'bottom'
            backgroundColor: "rgba(0,0,0,0.0)",
            color: "white",
            padding: "5px",
            fontSize: "12px",
            zIndex: 10000, // Increased z-index
          }}
        >
          <br />
        </div>
      </>
    );
  };

  const closeWindow = (id) => {
    setOpenWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: false },
    }));
  };

  const sensors = useSensors(
    useSensor(
      PointerSensor,
      {
        activationConstraint: {
          distance: 5,
        },
      },
      useSensor(TouchSensor, {
        activationConstraint: {
          delay: 100,
          tolerance: 5,
        },
      })
    )
  );

  return (
    <div
      style={{
        background: "#444444",
        pointerEvents: isLookingAtComputer ? "" : "none",
        width: "1024px",
        height: "684px",
        position: "relative",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      
      {bootStage >= 1 && (
        <div className="screen" ref={screenRef}>
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            collisionDetection={customCollisionDetectionWithWindowPriority}
          >
            <DroppableArea
              id="desktop"
              style={{ width: "100%", height: "100%" }}
            >
              <div
                className="desktop"
                ref={desktopRef}
                onClick={() => handleClick(null, null)}
                style={{
                  fontFamily: "Chicago_12",
                  position: "absolute",
                  left: "0",
                  top: "0",
                  width: "100%",
                  height: "100%",
                  border: "1px solid black",
                  overflow: "hidden",
                }}
              >
                {bootStage >= 2 && bootStage < 3 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "40%",
                      left: "50%",
                      width: "850px",
                      height: "175px",
                      transform: "translate(-50%, -50%)",
                      backgroundColor: "white",
                      padding: "20px",
                      border: "2px solid black",
                      boxShadow: "4px 4px black",
                      display: "flex",
                      zIndex: 10001,
                    }}
                  >
                    <img
                      src={WacPicassoLogo}
                      alt="Wacintosh Logo"
                      style={{
                        paddingTop: "1rem",
                        height: "64px",
                        width: "70px",
                        paddingRight: "220px",
                        paddingLeft: "25px",
                      }}
                    />
                    <h2
                      style={{
                        fontFamily: "Chicago_12",
                        fontSize: "31px",
                        fontWeight: "400",
                      }}
                    >
                      Welcome to Wacintosh.
                    </h2>
                  </div>
                )}

                {bootStage >= 3 && (
                  <div
                    className="menu-bar"
                    style={{
                      position: "relative",
                      zIndex: "100000",
                      borderBottom: "2px solid black",
                      padding: "2px 0",
                      backgroundColor: "#fff",
                      width: "100%",
                      height: MENU_BAR_HEIGHT,
                    }}
                  >
                    <ul role="menu-bar">
                      <li
                        className="menu-item"
                        role="menu-item"
                        style={{ marginLeft: "20px" }}
                      >
                        <span
                          className="apple"
                          onMouseDown={zoomOut}
                          style={{
                            backgroundSize: "contain",
                            width: "22px",
                            height: "22px",
                            bottom: "2px",
                          }}
                        ></span>
                      </li>
                      <li
                        className="menu-item"
                        role="menu-item"
                        aria-haspopup="true"
                        onMouseDown={(e) => handleMenuMouseDown("File", e)}
                        onMouseEnter={() => handleMenuMouseEnter("File")}
                      >
                        <span className="menu-text">File</span>
                        {openMenu === "File" && (
                          <ul role="menu">
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("New")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "New"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "New"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                New
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Open")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Open"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Open"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Open
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              className="divider"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Save")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Save"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Save"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Save
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Other")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Other"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Other"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Other
                              </a>
                            </li>
                          </ul>
                        )}
                      </li>
                      <li
                        className="menu-item"
                        role="menu-item"
                        onMouseDown={(e) => handleMenuMouseDown("Edit", e)}
                        onMouseEnter={() => handleMenuMouseEnter("Edit")}
                      >
                        <span className="menu-text">Edit</span>
                        {openMenu === "Edit" && (
                          <ul role="menu">
                            <li
                              role="menu-item"
                              className="divider"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Undo")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Undo"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Undo"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Undo
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Cut")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Cut"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Cut"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Cut
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Copy")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Copy"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Copy"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Copy
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Paste")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Paste"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Paste"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Paste
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Clear")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Clear"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Clear"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Clear
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              className="divider"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Select All")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Select All"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Select All"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Select All
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Show Clipboard")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Show Clipboard"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Show Clipboard"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Show Clipboard
                              </a>
                            </li>
                          </ul>
                        )}
                      </li>
                      <li
                        className="menu-item"
                        role="menu-item"
                        onMouseDown={(e) => handleMenuMouseDown("View", e)}
                        onMouseEnter={() => handleMenuMouseEnter("View")}
                      >
                        <span className="menu-text">View</span>
                        {openMenu === "View" && (
                          <ul role="menu">
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("by Icon")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "by Icon"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "by Icon"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                by Icon
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("by Name")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "by Name"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "by Name"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                by Name
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("by Date")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "by Date"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "by Date"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                by Date
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("by Size")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "by Size"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "by Size"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                by Size
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("by Kind")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "by Kind"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "by Kind"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                by Kind
                              </a>
                            </li>
                          </ul>
                        )}
                      </li>
                      <li
                        className="menu-item"
                        role="menu-item"
                        onMouseDown={(e) => handleMenuMouseDown("Special", e)}
                        onMouseEnter={() => handleMenuMouseEnter("Special")}
                      >
                        <span className="menu-text">Special</span>
                        {openMenu === "Special" && (
                          <ul role="menu">
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Clean Up")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Clean Up"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Clean Up"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Clean Up
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Empty Trash")
                              }
                              onClick={() =>
                                handleMenuItemClick("Special", "Empty Trash")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Empty Trash"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Empty Trash"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Empty Trash
                              </a>
                            </li>
                            <li
                              role="menu-item"
                              onMouseEnter={() =>
                                handleMenuItemMouseEnter("Erase Disk")
                              }
                            >
                              <a
                                href="#menu"
                                style={{
                                  backgroundColor:
                                    activeMenuItem === "Erase Disk"
                                      ? "black"
                                      : "white",
                                  color:
                                    activeMenuItem === "Erase Disk"
                                      ? "white"
                                      : "black",
                                }}
                              >
                                Erase Disk
                              </a>
                            </li>
                          </ul>
                        )}
                      </li>
                    </ul>
                  </div>
                )}
                {bootStage >= 4 && (
                  <>
                    <DebugOverlay screenDimensions={screenDimensions} />
                    {icons.map((icon) => (
                      <DraggableIcon
                        key={icon.id}
                        id={icon.id}
                        name={icon.name}
                        position={icon.position}
                        onDoubleClick={() => handleDoubleClick(icon.id)}
                        onClick={(e) => handleClick(icon.id, null, e)}
                        className="icon"
                        selected={
                          selectedIcon &&
                          selectedIcon.id === icon.id &&
                          !selectedIcon.parentId
                        }
                        isOver={overFolderId === icon.id}
                        type={icon.type}
                        zIndex={
                          elementZIndexes[icon.id] || BASE_DESKTOP_ICON_Z_INDEX
                        }
                        isOpen={openWindows[icon.id]?.isOpen}
                      >
                        {icon.content}
                      </DraggableIcon>
                    ))}
                    {Object.entries(openWindows).map(
                      ([id, windowData]) =>
                        windowData.isOpen && (
                          <Window
                            key={id}
                            id={id}
                            title={windowData.title || ""}
                            content={id === "readme" ? readmeContent : null}
                            readMeStage={readMeStage}
                            items={
                              icons.find((icon) => icon.id === id)?.items ||
                              windowData.items
                            }
                            onClose={() => closeWindow(id)}
                            onMinimize={(id, isMinimized) =>
                              minimizeWindow(id, isMinimized)
                            }
                            onFocus={() => handleWindowFocus(id)}
                            onMove={handleWindowMove}
                            onResize={handleWindowResize}
                            zIndex={
                              windowZIndexes[id] || BASE_INACTIVE_WINDOW_Z_INDEX
                            }
                            itemCount={
                              id === "trash" ? trashContents.length : undefined
                            }
                            trashSize={id === "trash" ? trashSize : undefined}
                            screenDimensions={screenDimensions}
                            position={windowData.position}
                            size={windowData.size}
                            onIconInteraction={(iconId, interactionType) =>
                              handleIconInteraction(iconId, interactionType, id)
                            }
                            selectedIcon={selectedIcon}
                            elementZIndexes={elementZIndexes}
                            BASE_WINDOW_ICON_Z_INDEX={BASE_WINDOW_ICON_Z_INDEX}
                          >
                            {windowData.items.map((item) => (
                              <DraggableIcon
                                key={`${item.id}-${windowData.position.x}-${windowData.position.y}`}
                                id={item.id}
                                name={item.name}
                                position={item.position || { x: 0, y: 0 }}
                                onDoubleClick={() =>
                                  handleDoubleClick(item.id, id)
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClick(item.id, windowData.id);
                                  handleIconFocus(item.id);
                                }}
                                className="icon"
                                selected={
                                  selectedIcon &&
                                  selectedIcon.id === item.id &&
                                  !selectedIcon.parentId
                                }
                                parentId={id}
                                type={item.type}
                                zIndex={
                                  elementZIndexes[item.id] ||
                                  BASE_WINDOW_ICON_Z_INDEX
                                }
                                itemCount={
                                  id === "trash" ? trashContents.length : undefined
                                }
                                trashSize={id === "trash" ? trashSize : undefined}
                                items={item.items}
                                trashContents={id === "trash" ? trashContents : undefined}
                                updateTrashContents={id === "trash" ? updateTrashContents : undefined}
                                isOver={overFolderId === item.id}
                                isOpen={openWindows[item.id]?.isOpen}
                              >
                                {item.content}
                              </DraggableIcon>
                            ))}
                          </Window>
                        )
                    )}
                  </>
                )}
              </div>
            </DroppableArea>
          </DndContext>
          <div
            id="dragging-container"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 10000,
            }}
          ></div>
          {openWindows["about"] && (
            <Window
              id="about"
              title="About This Macintosh"
              onClose={() => closeWindow("about")}
              style={{
                width: "250px",
                height: "150px",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
              zIndex={windowZIndex["about"] || 0}
            >
              <div style={{ padding: "10px", fontSize: "12px" }}>
                <p>
                  <strong>Wacintosh 128K</strong>
                </p>
                <p>System Software 1.0</p>
                <p>© 1984 Guava Computer, Inc.</p>
              </div>
            </Window>
          )}
          {taskCompleted && completedWindowTimer && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "white",
                padding: "20px",
                border: "2px solid black",
              }}
            >
              <h2>Task Completed!</h2>
              <p>
                All files are correctly organized. You can now run the
                Environment application.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default System1;
