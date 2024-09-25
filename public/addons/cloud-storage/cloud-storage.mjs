export function init(editor){
    let username = new editor.ContextMenuItem("cs-si","Username: ",function(){});
    username.disabled=true;
    let signIn = new editor.ContextMenuItem("cs-si","Sign in",function(){});
    editor.addItemToTopbar(new editor.BarItem("cs-tb","Cloud",new editor.ContextMenu([username,signIn])))
}