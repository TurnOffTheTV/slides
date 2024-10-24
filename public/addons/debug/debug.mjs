export function init(editor){
	editor.forcePresAvailable();
    editor.addItemToTopbar(new editor.BarItem("debug-topbar-menu","Debug",
        new editor.ContextMenu([
            new editor.ContextMenuItem("debug-change-file","Change File",function(){editor.changeFile()}),
            new editor.ContextMenuItem("debug-log-presentation","Log Presentation Var to Console",function(){console.log(editor.presentation)}),
			new editor.ContextMenuItem("debug-set-edititem","Set editItem",function(){editor.setEditItemIndex(+prompt("editItem",undefined))})
        ])
    ));
}