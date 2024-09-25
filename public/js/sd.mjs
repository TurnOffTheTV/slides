export function create(pres){
	//create buffer
	let bytes = new DataView(new ArrayBuffer(pres.name.length+10));
	let textEncoder = new TextEncoder();
	//add file identifier
	bytes.setUint8(0,83);//S
	bytes.setUint8(1,68);//D
	//set project name
	bytes.setUint8(2,pres.name.length);
	for(var i=0;i<pres.name.length;i++){
		bytes.setUint8(i+3,textEncoder.encode(pres.name)[i]);
	}
	//set sample rate
	bytes.setUint32(pres.name.length+3,pres.sampleRate);
	//set channel count
	bytes.setUint16(pres.name.length+7,pres.channels.length);
	//TODO: insert channel and audio data
	return bytes;
}

export async function parse(blob){
	let pres = {
		name:"New Presentation",
		sampleRate:44100,
		channels:[],
		patches:[]
	};
	let textDecoder = new TextDecoder();
	//turn file into buffer
	let bytes = new DataView(await blob.arrayBuffer());
	console.log(bytes);
	//check if it's an SD file
	if(textDecoder.decode(bytes).slice(0,3)!=="SD"){
		throw Error("Given file is not a proper SD file.");
	}
	try {
		//read project name
		pres.name=textDecoder.decode(bytes).slice(4,bytes.getUint8(3)+4);
		//read sample rate
		pres.sampleRate = bytes.getUint32(bytes.getUint8(3)+4);
		//get number of groups
		let numChannels = bytes.getUint16(bytes.getUint8(3)+8);
		//TODO: get channel and audio data
	} catch(err){
		throw Error("Given file is not a proper SD file.",{cause:err});
	}
	return {channels:[],pres:pres};
}

export let fileOpts = {
	types:[
		{accept:{"application/sd":[".sd"]}}
	],
	suggestedName:"New Presentation.sd"
};