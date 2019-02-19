export function  getProfileDocumentLocation (webid) {

	if (webid.indexOf('#') >= 0 )
	{
		return webid.substr(0 , webid.lastIndexOf('#'));
	}

	return "";
};

export function getProfileUrl(webid: string):string{
	let regexCardMe = new RegExp("profile/card#me")
	
	if( regexCardMe.test(webid) )
	return webid

	else

	return removeDuplicateSlashInURL(webid) + "profile/card#me"
}

export function removeDuplicateSlashInURL(url) {

	var urlPath = url;
	var protocol = "";

	if ( url.indexOf("https") === 0 )
	{
		urlPath = url.substr(8 , url.length);
		protocol = "https://";
	}
	else if (url.indexOf("http") === 0 )
	{
		urlPath = url.substr(7 , url.length);
		protocol = "http://";
	}

	var comps = urlPath.split("/");
	var newComps = [];

	for ( var i in comps )
	{
		var item = comps[i];

		if ( item.length > 0 )
			newComps.push(item);
	}

	return protocol + newComps.join("/");
};

export function timestampToDate(timestamp) {
	var a = new Date(timestamp * 1000);
	  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	  var year = a.getFullYear();
	  var month = months[a.getMonth()];
	  var date = a.getDate();
	  var hour = a.getHours();
	  var min = a.getMinutes();
	  var sec = a.getSeconds();
	  var time = date + ' ' + month + year + hour + ':' + min + ':' + sec ;
	  return time;
};

var friendlyWebid = function(webid) {

	return webid
			.split('/').join("")
			.split(':').join("")
			.split('#').join("")
			.split('.').join("");
};

export function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function removeTrailingSlash(str){
	if(str.substr(-1) === '/' && str.length > 2) {
        return str.substr(0, str.length - 1);
    }
    return str;
}