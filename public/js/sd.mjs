export function create(pres){
	//create buffer
	let totalDataLength = pres.name.length+5;
	let bytes = new DataView(new ArrayBuffer(pres.name.length+5));
	let textEncoder = new TextEncoder();
	//add file identifier
	bytes.setUint8(0,83);//S
	bytes.setUint8(1,68);//D
	//set presentation name
	bytes.setUint8(2,pres.name.length);
	for(let i=0;i<pres.name.length;i++){
		bytes.setUint8(i+3,textEncoder.encode(pres.name)[i]);
	}
	//set channel count
	bytes.setUint16(pres.name.length+3,pres.groups.length);
	
	//create group data
	let groupData = [];
	for(let i=0;i<pres.groups.length;i++){
		let group = new DataView(new ArrayBuffer(pres.groups[i].name.length+8));
		for(let j=0;j<5;j++){
			group.setUint8(j,textEncoder.encode(pres.groups[i].id)[j]);
		}
		group.setUint8(5,pres.groups[i].name.length);
		for(let j=0;j<pres.groups[i].name.length;j++){
			group.setUint8(j+6,textEncoder.encode(pres.groups[i].name)[j]);
		}
		group.setUint16(pres.groups[i].name.length+6,pres.groups[i].slides.length);
		groupData.push(group);
		totalDataLength+=group.byteLength;
	}
	let finalData = new Blob([bytes].concat(groupData));
	
	return finalData;
}

export async function parse(blob){
	let pres = {
		name:"New Presentation",
		groups:[]
	};
	let textDecoder = new TextDecoder();
	//turn file into buffer
	let bytes = new DataView(await blob.arrayBuffer());
	//check if it's an SD file
	if(textDecoder.decode(bytes).slice(0,2)!=="SD"){
		throw Error("Given file is not a proper SD file.");
	}

	let groups = [];

	try {
		console.log(bytes.buffer);
		//read presentation name
		pres.name=textDecoder.decode(bytes).slice(3,bytes.getUint8(2)+3);
		//get number of groups
		let numGroups = bytes.getUint16(bytes.getUint8(2)+3);

		let offset = bytes.getUint8(2)+5;
		for(let i=0;i<numGroups;i++){
			let group = {};
			group.id=textDecoder.decode(bytes).slice(offset,offset+5);
			group.name=textDecoder.decode(bytes).slice(offset+6,offset+6+bytes.getUint8(offset+5));
			groups.push(group);
			offset+=8+bytes.getUint8(offset+5);
		}
	} catch(err){
		throw Error("Given file is not a proper SD file.",{cause:err});
	}
	return {groups,pres:pres};
}

export let fileOpts = {
	types:[
		{accept:{"application/sd":[".sd"]}}
	],
	suggestedName:"New Presentation.sd"
};