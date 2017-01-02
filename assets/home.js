(function () {

  var tagline = document.getElementById('home-tagline');

  tagline.addEventListener('mouseover', function replaceLine() {

    tagline.removeEventListener('mouseover', replaceLine);
    var originalText = tagline.textContent;

    document.body.style.cursor = 'progress';

    function eat() {

      for (var k = 0; k < 2; k++) {
        if (!tagline.textContent) {
          var i;
          do {
           i = Math.floor(Math.random() * siteTaglines.length);
          } while (siteTaglines[i] === originalText);
          var nextLine = siteTaglines[i];

          function write() {

            for (var j = 0; j < 2; j++) {
              if (!nextLine.length) {
                document.body.style.cursor = 'auto';
                tagline.addEventListener('mouseover', replaceLine);
                return;
              }

              tagline.textContent += nextLine.charAt(0);
              nextLine = nextLine.slice(1);
            }

            setTimeout(write, 20);

          }
          write();
          return;
        }

        tagline.textContent = tagline.textContent.slice(0, -1);
      }
      setTimeout(eat, 20);

    }

    eat();

  });

})();
