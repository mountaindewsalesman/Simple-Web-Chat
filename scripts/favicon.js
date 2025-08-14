function setFaviconBadge(number) {
    let favObject = document.querySelector("link[rel~='icon']");
    const defaultFavicon = 'favicon.png';

    if(number == 0){
        favObject.href = defaultFavicon;
    }else{
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // Draw original favicon background (or a circle)
        ctx.fillStyle = '#ff0000'; // red background
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, 2 * Math.PI);
        ctx.fill();

        // Draw number
        ctx.fillStyle = '#ffffff';
        ctx.font = number > 9 ? 'bold 17px sans-serif' : 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number > 99 ? '99+' : number, 16, 16);

        // Replace favicon
        favObject.href = canvas.toDataURL('image/png');
    }    
}
