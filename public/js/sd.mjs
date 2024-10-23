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
	
	//create group list
	let groupData = [];
	for(let i=0;i<pres.groups.length;i++){
		//create group
		let group = new DataView(new ArrayBuffer(pres.groups[i].name.length+8));

		//set group id
		for(let j=0;j<5;j++){
			group.setUint8(j,textEncoder.encode(pres.groups[i].id)[j]);
		}

		//set group name
		group.setUint8(5,pres.groups[i].name.length);
		for(let j=0;j<pres.groups[i].name.length;j++){
			group.setUint8(j+6,textEncoder.encode(pres.groups[i].name)[j]);
		}

		//set group slides
		group.setUint16(pres.groups[i].name.length+6,pres.groups[i].slides.length);
		groupData.push(group);
		totalDataLength+=group.byteLength;
		for(let j=0;j<pres.groups[i].slides.length;j++){
			//create slides

			//set buffer length based on background color
			let colorLength;
			let colorByte;
			if(typeof pres.groups[i].slides[j].background==="string"){
				colorLength=4;
				colorByte=0;
			}else{
				colorByte=255;
			}
			let slide = new DataView(new ArrayBuffer(pres.groups[i].slides[j].name.length+colorLength+3));
			
			//set slide name
			slide.setUint8(0,pres.groups[i].slides[j].name.length);
			for(let k=0;k<pres.groups[i].slides[j].name.length;k++){
				slide.setUint8(k+1,textEncoder.encode(pres.groups[i].slides[j].name)[k]);
			}

			slide.setUint8(1+pres.groups[i].slides[j].name.length,colorByte);
			switch(colorByte){
				case 0:
					//get color info from rgb()
					let colors = JSON.parse(pres.groups[i].slides[j].background.slice(3).replace("(","[").replace(")","]"));
					console.log(colors);
					slide.setUint8(2+pres.groups[i].slides[j].name.length,colors[0]);
					slide.setUint8(3+pres.groups[i].slides[j].name.length,colors[1]);
					slide.setUint8(4+pres.groups[i].slides[j].name.length,colors[2]);
				break;
			}

			//set content object count - DEBUG ONLY set to 0 until content objs added
			//slide.setUint16(1+colorLength+pres.groups[i].slides[j].name.length,pres.groups[i].slides[j].contents.length);
			slide.setUint16(1+colorLength+pres.groups[i].slides[j].name.length,0);

			groupData.push(slide);

			//TODO: add content objects
		}
	}

	//return concatentation of all data
	return new Blob([bytes].concat(groupData));
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
		throw Error("Given file is not a proper SD file.",{cause:"Does not contain SD file identifier"});
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
			let group = {slides:[]};
			//read group ID and name
			group.id=+textDecoder.decode(bytes).slice(offset,offset+5);
			group.name=textDecoder.decode(bytes).slice(offset+6,offset+6+bytes.getUint8(offset+5));
			
			//read group slides
			group.numSlides=bytes.getUint16(offset+6+bytes.getUint8(offset+5));
			groups.push(group);
			offset+=8+bytes.getUint8(offset+5);
			for(let j=0;j<group.numSlides;j++){
				//read slide
				let slide = {contents:[]};
				slide.name=textDecoder.decode(bytes).slice(offset+1,offset+1+bytes.getUint8(offset));
				offset+=1+bytes.getUint8(offset);
				//read slide background
				switch(bytes.getUint8(offset)){
					case 0:
						slide.background=[bytes.getUint8(offset+1),bytes.getUint8(offset+2),bytes.getUint8(offset+3)];
					break;
				}
				group.slides.push(slide);
			}
		}
	} catch(err){
		//if there are file reading errors
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