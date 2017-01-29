(function () {

  var tagline = document.getElementById('home-tagline');

  tagline.addEventListener('mouseover', function taglineReplace() {
    document.body.style.cursor = 'progress';
    tagline.removeEventListener('mouseover', taglineReplace);

    // Randomize next message different to current one
    var i;
    do {
     i = Math.floor(Math.random() * siteTaglines.length);
    } while (siteTaglines[i] === tagline.textContent);

    replaceLine(tagline, siteTaglines[i], function () {
      document.body.style.cursor = 'auto';
      tagline.addEventListener('mouseover', taglineReplace);
    });
  });

  function replaceLine(element, text, callback) {

    var originalText = element.textContent;

    function eat() {
      // loop to speed up the animation
      for (var k = 0; k < 2; k++) {
        if (!element.textContent) {
          function write() {
            // loop to speed up the animation
            for (var j = 0; j < 2; j++) {
              if (!text.length) {
                callback();
                return;
              }
              element.textContent += text.charAt(0);
              text = text.slice(1);
            }
            setTimeout(write, 20);
          }
          write();
          return;
        }
        element.textContent = element.textContent.slice(0, -1);
      }
      setTimeout(eat, 20);
    }
    eat();
  }

  function nrnd(mean, sd) {
    return mean + sd * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
  }

  function clip(value, lower, upper) {
    return Math.max(lower, Math.min(upper, value));
  }

  function scheduleDucks() {
    var duckpool = document.getElementById('duckpool');
    var homenav = document.getElementById('home-nav');
    // In case we need to put some dummy ducks to sample their distribution...
    // sitePosts.push.apply(sitePosts,[{},{},{},{},{},[],[],[],[],[],[],[],[],[],[],[],[],[],[]]);
    function generateRandomXLocation() {
      return Math.random() * (duckpool.offsetWidth - 100) + 50;
    }
    sitePosts.forEach(function (post) {
      // Note: don't cache dimensions as they may change (e.g. resizing window)
      var height = homenav.offsetTop - duckpool.offsetTop;
      var upperQuarter = 0.2 * height;
      var lowerQuarter = 0.8 * height;
      var mean = Math.random() < 0.5? upperQuarter : lowerQuarter;
      var sd = 0.1 * 0.5 * height;
      var y = clip(nrnd(mean, sd), 50, height - 50);
      var x = generateRandomXLocation();
      var duck = document.createElement('a');
      duck.classList.add('duck');
      duck.setAttribute('title', post.title);
      duck.href = siteBaseurl + post.url;
      duck.style.top = y + 'px';
      duck.style.left = x + 'px';
      duckpool.appendChild(duck);
      var duckspeech = document.createElement('div');
      duck.appendChild(duckspeech);
      function scheduleNextMove() {
        if (Math.random() < 0.8) {
          // Quack
          var message = Math.random() < 0.7? 'Quack!' : 'Quack Quack!';
          setTimeout(function quack() {
            duckspeech.classList.add('duck-quack');
            replaceLine(duckspeech, message, function () {
              setTimeout(function() {
                replaceLine(duckspeech, '', function () {
                  duckspeech.classList.remove('duck-quack');
                  scheduleNextMove();
                });
              }, 500);
            });
          }, Math.max(0, nrnd(5000,5000)));
        }
        else {
          // Move
          var speed = Math.max(3, nrnd(5, 3));
          var target = generateRandomXLocation();
          var isRight = target - parseInt(duck.style.left) > 0;
          const duckClasses = ['duck-left', 'duck-right'];
          duck.classList.add(duckClasses[+isRight]);
          duck.classList.remove(duckClasses[+!isRight]);
          setTimeout(function move() {
            var left = parseInt(duck.style.left);
            var distance = target - left;
            var increment = Math.round(clip(0.3 * distance, -speed, speed));
            if (Math.abs(distance) <= 1) {
              scheduleNextMove();
              return;
            }
            duck.style.left = left + increment + 'px';
            setTimeout(move, 100);
          }, Math.max(0, nrnd(5000,5000)));
        }
      }
      scheduleNextMove();
    });
  }
  scheduleDucks();
})();
