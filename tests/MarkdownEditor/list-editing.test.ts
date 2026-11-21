import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { createEditorExtensions } from "../../src/components/MarkdownEditor/markdown/tiptapMarkdownBridge";
import {
  deleteEmptyListItem,
  joinNextLineAcrossList,
  tripleClickLineSelection,
} from "../../src/components/MarkdownEditor/markdown/listEditing";

// Bug list-item-delete-cascade: borrar en listas anidadas no debe arrastrar ni
// re-nivelar los ítems de alrededor.

const li = (text: string, inner = "") => `<li><p>${text}</p>${inner}</li>`;
const ti = (text: string, inner = "") => `<li data-type="taskItem" data-checked="false"><p>${text}</p>${inner}</li>`;
const ul = (...items: string[]) => `<ul>${items.join("")}</ul>`;
const tl = (...items: string[]) => `<ul data-type="taskList">${items.join("")}</ul>`;
const EMPTY = "<li><p></p></li>";

let editor: Editor | null = null;
afterEach(() => {
  editor?.destroy();
  editor = null;
});

function make(html: string): Editor {
  editor = new Editor({ extensions: createEditorExtensions({ sanitizeEmbeddedHtml: true }), content: html });
  return editor;
}

/** Árbol legible: una línea por bloque, sangrado por nivel de lista. */
function tree(doc: PMNode): string {
  const out: string[] = [];
  const walk = (node: PMNode, depth: number) => {
    node.forEach((child) => {
      if (child.type.name === "listItem" || child.type.name === "taskItem") {
        out.push(`${"  ".repeat(depth)}- ${child.firstChild?.textContent || "∅"}`);
        child.forEach((inner, _offset, index) => {
          if (index === 0) return;
          if (/List$/.test(inner.type.name)) walk(inner, depth + 1);
          else out.push(`${"  ".repeat(depth + 1)}P:${inner.textContent}`);
        });
      } else if (/List$/.test(child.type.name)) walk(child, depth);
      else if (child.textContent !== "") out.push(`${"  ".repeat(depth)}P:${child.textContent}`);
    });
  };
  walk(doc, 0);
  return out.join("\n");
}

function find(ed: Editor, text: string): number {
  let found = -1;
  ed.state.doc.descendants((node, pos) => {
    if (found === -1 && node.isText && node.text === text) found = pos;
  });
  return found;
}

function emptyItemPos(ed: Editor): number {
  let found = -1;
  ed.state.doc.descendants((node, pos, parent) => {
    if (found === -1 && node.type.name === "paragraph" && node.content.size === 0 && parent?.type.name.endsWith("Item")) {
      found = pos + 1;
    }
  });
  return found;
}

function press(ed: Editor, key: "Backspace" | "Delete"): void {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  ed.view.someProp("handleKeyDown", (handler) => handler(ed.view, event));
}

describe("Retroceso en un ítem vacío (variante B)", () => {
  it("elimina el ítem y el de abajo conserva padre y nivel; el cursor queda al final de la línea de arriba", () => {
    const ed = make(ul(li("otro", ul(li("item 1"), EMPTY, li("item 3"))), li("fin")));
    ed.commands.setTextSelection(emptyItemPos(ed));
    press(ed, "Backspace");
    expect(tree(ed.state.doc)).toBe("- otro\n  - item 1\n  - item 3\n- fin");
    expect(ed.state.selection.from).toBe(find(ed, "item 1") + "item 1".length);
  });

  it("los hijos del ítem vacío pasan al ítem anterior", () => {
    const ed = make(ul(li("otro", ul(li("item 1"), `<li><p></p>${ul(li("hijo"))}</li>`, li("item 3")))));
    ed.commands.setTextSelection(emptyItemPos(ed));
    press(ed, "Backspace");
    expect(tree(ed.state.doc)).toBe("- otro\n  - item 1\n    - hijo\n  - item 3");
  });

  it("si el anterior ya tiene sublista, los hijos se suman a ella", () => {
    const ed = make(ul(li("item 1", ul(li("a"))), `<li><p></p>${ul(li("b"))}</li>`, li("item 3")));
    ed.commands.setTextSelection(emptyItemPos(ed));
    press(ed, "Backspace");
    expect(tree(ed.state.doc)).toBe("- item 1\n  - a\n  - b\n- item 3");
  });

  it("funciona igual en listas de tareas", () => {
    const ed = make(tl(ti("otro", tl(ti("item 1"), `<li data-type="taskItem" data-checked="false"><p></p></li>`, ti("item 3")))));
    ed.commands.setTextSelection(emptyItemPos(ed));
    press(ed, "Backspace");
    expect(tree(ed.state.doc)).toBe("- otro\n  - item 1\n  - item 3");
  });

  it("el primer ítem vacío de una lista conserva el comportamiento por defecto", () => {
    const ed = make(ul(li("otro", ul(EMPTY, li("item 2")))));
    ed.commands.setTextSelection(emptyItemPos(ed));
    expect(deleteEmptyListItem(ed.state)).toBe(false);
  });

  it("un ítem con texto no se ve afectado", () => {
    const ed = make(ul(li("item 1"), li("item 2")));
    ed.commands.setTextSelection(find(ed, "item 2"));
    expect(deleteEmptyListItem(ed.state)).toBe(false);
  });

  it("es un solo paso de deshacer", () => {
    const before = ul(li("item 1"), EMPTY, li("item 3"));
    const ed = make(before);
    const original = tree(ed.state.doc);
    ed.commands.setTextSelection(emptyItemPos(ed));
    press(ed, "Backspace");
    ed.commands.undo();
    expect(tree(ed.state.doc)).toBe(original);
  });
});

describe("Suprimir al final de una línea (variante C)", () => {
  const TREE = ul(li("otro", ul(li("item 1"), li("item 2", ul(li("item 2.a"))), li("item 3"))), li("fin"));

  const cases: Array<[string, string, string]> = [
    ["al final de un ítem con hijos, une el texto del primer hijo y el resto conserva su nivel", "otro",
      "- otroitem 1\n  - item 2\n    - item 2.a\n  - item 3\n- fin"],
    ["al final de un ítem con un hijo, une el texto del hijo", "item 2",
      "- otro\n  - item 1\n  - item 2item 2.a\n  - item 3\n- fin"],
    ["al final del último ítem anidado, une el texto del ítem de arriba sin bajarlo de nivel", "item 3",
      "- otro\n  - item 1\n  - item 2\n    - item 2.a\n  - item 3fin"],
    ["entre hermanos, une el texto y los hijos pasan al ítem que lo recibe", "item 1",
      "- otro\n  - item 1item 2\n    - item 2.a\n  - item 3\n- fin"],
  ];
  for (const [title, at, expected] of cases) {
    it(title, () => {
      const ed = make(TREE);
      ed.commands.setTextSelection(find(ed, at) + at.length);
      press(ed, "Delete");
      expect(tree(ed.state.doc)).toBe(expected);
      const $cursor = ed.state.selection.$from;
      expect($cursor.parent.textContent.startsWith(at)).toBe(true);
      expect($cursor.parentOffset).toBe(at.length);
    });
  }

  it("al final del último ítem, el párrafo siguiente se une al ítem en vez de volverse ítem", () => {
    const ed = make(`<p>antes</p>${ul(li("uno"), li("dos"))}<p>despues</p>`);
    ed.commands.setTextSelection(find(ed, "dos") + 3);
    press(ed, "Delete");
    expect(tree(ed.state.doc)).toBe("P:antes\n- uno\n- dosdespues");
  });

  it("al final de un párrafo antes de una lista, une el primer ítem y la lista sigue", () => {
    const ed = make(`<p>antes</p>${ul(li("uno"), li("dos"))}`);
    ed.commands.setTextSelection(find(ed, "antes") + 5);
    press(ed, "Delete");
    expect(tree(ed.state.doc)).toBe("P:antesuno\n- dos");
  });

  it("si el único ítem de la lista se une, la lista vacía desaparece", () => {
    const ed = make(`<p>antes</p>${ul(li("uno"))}<p>despues</p>`);
    ed.commands.setTextSelection(find(ed, "antes") + 5);
    press(ed, "Delete");
    expect(tree(ed.state.doc)).toBe("P:antesuno\nP:despues");
  });

  it("funciona igual en listas de tareas", () => {
    const ed = make(tl(ti("otro", tl(ti("item 1"), ti("item 2"))), ti("fin")));
    ed.commands.setTextSelection(find(ed, "otro") + 4);
    press(ed, "Delete");
    expect(tree(ed.state.doc)).toBe("- otroitem 1\n  - item 2\n- fin");
  });

  it("sin límite de lista entre las líneas, conserva el comportamiento por defecto", () => {
    const ed = make("<p>uno</p><p>dos</p>");
    ed.commands.setTextSelection(find(ed, "uno") + 3);
    expect(joinNextLineAcrossList(ed.state)).toBe(false);
  });

  it("en mitad de una línea, conserva el comportamiento por defecto", () => {
    const ed = make(TREE);
    ed.commands.setTextSelection(find(ed, "otro") + 2);
    expect(joinNextLineAcrossList(ed.state)).toBe(false);
  });

  it("es un solo paso de deshacer", () => {
    const ed = make(TREE);
    const original = tree(ed.state.doc);
    ed.commands.setTextSelection(find(ed, "otro") + 4);
    press(ed, "Delete");
    ed.commands.undo();
    expect(tree(ed.state.doc)).toBe(original);
  });
});

describe("mover un ítem con Ctrl+Mayús+↑/↓ (spec 026)", () => {
  function move(ed: Editor, key: "ArrowUp" | "ArrowDown"): boolean {
    const event = new KeyboardEvent("keydown", { key, ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true });
    return ed.view.someProp("handleKeyDown", (handler) => handler(ed.view, event)) ?? false;
  }

  it("sube y baja un ítem; el cursor queda en el mismo texto", () => {
    const ed = make(ul(li("a"), li("b"), li("c")));
    ed.commands.setTextSelection(find(ed, "b") + 1);
    move(ed, "ArrowUp");
    expect(tree(ed.state.doc)).toBe("- b\n- a\n- c");
    expect(ed.state.selection.$from.parent.textContent).toBe("b");
    expect(ed.state.selection.$from.parentOffset).toBe(1);
    move(ed, "ArrowDown");
    move(ed, "ArrowDown");
    expect(tree(ed.state.doc)).toBe("- a\n- c\n- b");
  });

  it("un ítem con hijos se mueve con su subárbol y nadie cambia de nivel", () => {
    const ed = make(ul(li("otro", ul(li("item 1", ul(li("x"))), li("item 2"))), li("fin")));
    ed.commands.setTextSelection(find(ed, "item 1"));
    move(ed, "ArrowDown");
    expect(tree(ed.state.doc)).toBe("- otro\n  - item 2\n  - item 1\n    - x\n- fin");
  });

  it("en el primer o el último lugar no cambia nada (no salta a otra lista ni de nivel)", () => {
    const ed = make(ul(li("otro", ul(li("item 1"), li("item 2"))), li("fin")));
    const original = tree(ed.state.doc);
    ed.commands.setTextSelection(find(ed, "item 1"));
    expect(move(ed, "ArrowUp")).toBe(true);
    ed.commands.setTextSelection(find(ed, "item 2"));
    expect(move(ed, "ArrowDown")).toBe(true);
    expect(tree(ed.state.doc)).toBe(original);
  });

  it("la tarea conserva su estado marcado y la lista numerada solo cambia el orden", () => {
    const ed = make(tl(ti("uno"), `<li data-type="taskItem" data-checked="true"><p>dos</p></li>`));
    ed.commands.setTextSelection(find(ed, "dos"));
    move(ed, "ArrowUp");
    expect(ed.state.doc.firstChild?.firstChild?.attrs["checked"]).toBe(true);
    expect(ed.state.doc.firstChild?.firstChild?.textContent).toBe("dos");
    const ol = make(`<ol><li><p>a</p></li><li><p>b</p></li></ol>`);
    ol.commands.setTextSelection(find(ol, "a"));
    move(ol, "ArrowDown");
    expect(ol.state.doc.firstChild?.type.name).toBe("orderedList");
    expect(tree(ol.state.doc)).toBe("- b\n- a");
  });

  it("varios ítems hermanos seleccionados se mueven juntos", () => {
    const ed = make(ul(li("a"), li("b"), li("c"), li("d")));
    ed.commands.setTextSelection({ from: find(ed, "b"), to: find(ed, "c") + 1 });
    move(ed, "ArrowDown");
    expect(tree(ed.state.doc)).toBe("- a\n- d\n- b\n- c");
  });

  it("fuera de una lista y en solo lectura no hace nada; es un solo paso de deshacer", () => {
    const para = make("<p>texto</p>");
    para.commands.setTextSelection(1);
    expect(move(para, "ArrowUp")).toBe(false);

    const ed = make(ul(li("a"), li("b")));
    ed.commands.setTextSelection(find(ed, "b"));
    ed.setEditable(false);
    move(ed, "ArrowUp");
    expect(tree(ed.state.doc)).toBe("- a\n- b");
    ed.setEditable(true);
    move(ed, "ArrowUp");
    expect(tree(ed.state.doc)).toBe("- b\n- a");
    ed.commands.undo();
    expect(tree(ed.state.doc)).toBe("- a\n- b");
  });

  it("movimientos seguidos se deshacen de a uno", () => {
    const ed = make(ul(li("a"), li("b"), li("c")));
    ed.commands.setTextSelection(find(ed, "a"));
    move(ed, "ArrowDown");
    move(ed, "ArrowDown");
    expect(tree(ed.state.doc)).toBe("- b\n- c\n- a");
    ed.commands.undo();
    expect(tree(ed.state.doc)).toBe("- b\n- a\n- c");
    ed.commands.undo();
    expect(tree(ed.state.doc)).toBe("- a\n- b\n- c");
  });

  it("Mayús+↑ sin Ctrl no mueve el ítem", () => {
    const ed = make(ul(li("a"), li("b")));
    ed.commands.setTextSelection(find(ed, "b"));
    const event = new KeyboardEvent("keydown", { key: "ArrowUp", shiftKey: true, bubbles: true, cancelable: true });
    ed.view.someProp("handleKeyDown", (handler) => handler(ed.view, event));
    expect(tree(ed.state.doc)).toBe("- a\n- b");
  });
});

describe("triple clic sobre contenedores (variante A)", () => {
  function containerPos(ed: Editor, type: string, nth = 0): number {
    const found: number[] = [];
    ed.state.doc.descendants((node, pos) => {
      if (node.type.name === type) found.push(pos);
    });
    return found[nth] ?? -1;
  }

  it("sobre una lista selecciona una línea, no la lista entera, y borrarla conserva los demás ítems", () => {
    const ed = make(ul(li("otro", ul(li("item 1"), li("item 2"), li("item 3"))), li("fin")));
    const selection = tripleClickLineSelection(ed.view, containerPos(ed, "bulletList", 1), 0);
    expect(selection).not.toBeNull();
    if (selection === null) return;
    expect(ed.state.doc.textBetween(selection.from, selection.to)).toBe("item 1");
    ed.view.dispatch(ed.state.tr.setSelection(selection).deleteSelection());
    expect(tree(ed.state.doc)).toBe("- otro\n  - ∅\n  - item 2\n  - item 3\n- fin");
  });

  it("sobre un ítem de tarea o una cita selecciona una línea", () => {
    const ed = make(tl(ti("tarea", tl(ti("hija")))) + "<blockquote><p>cita uno</p><p>cita dos</p></blockquote>");
    const task = tripleClickLineSelection(ed.view, containerPos(ed, "taskItem"), 0);
    expect(task && ed.state.doc.textBetween(task.from, task.to)).toBe("tarea");
    const quote = tripleClickLineSelection(ed.view, containerPos(ed, "blockquote"), 0);
    expect(quote && ed.state.doc.textBetween(quote.from, quote.to)).toBe("cita uno");
  });

  it("sobre una línea, una imagen o fuera de un contenedor deja el comportamiento por defecto", () => {
    const ed = make('<p>texto</p><img src="a.png" alt="">');
    expect(tripleClickLineSelection(ed.view, containerPos(ed, "paragraph"), 0)).toBeNull();
    expect(tripleClickLineSelection(ed.view, containerPos(ed, "image"), 0)).toBeNull();
    expect(tripleClickLineSelection(ed.view, -1, 0)).toBeNull();
  });
});
