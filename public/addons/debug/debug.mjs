export function init(editor){
    editor.addItemToTopbar(new editor.BarItem("debug-topbar-menu","Debug",
        new editor.ContextMenu([
            new editor.ContextMenuItem("debug-change-file","Change File",function(){editor.changeFile()}),
            new editor.ContextMenuItem("debug-log-project","Log Project Var to Console",function(){console.log(editor.project)}),
            new editor.ContextMenuItem("debug-log-patch","Log Current Patch to Console",function(){console.log(editor.synth.currentPatch)})
        ])
    ));
    editor.synth.setDebugMode(true);
}