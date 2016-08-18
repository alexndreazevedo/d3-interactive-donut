const width = 960;
const height = 480;
const radius = Math.min(width, height) / 2;
const animation = 1000;

const svg = d3.select('body')
  .append('svg')
    .attr('viewBox', [0, 0, width, height].join(' '))
  .append('g')

const pie = d3.pie()
  .sort(null)
  .value((d) => d.value);

const key = (d) => d.data.label;

const arc = d3.arc()
  .outerRadius(radius * 0.8)
  .innerRadius(radius * 0.5);

const selectedArc = d3.arc()
  .outerRadius(radius * 0.85)
  .innerRadius(radius * 0.55);

const outerArc = d3.arc()
  .innerRadius(radius * 0.9)
  .outerRadius(radius * 0.85);

const data = [{
    label: 'Stocks',
    value: 303.2,
    percent: 40,
    selected: false,
  }, {
    label: 'Property',
    value: 68.22,
    percent: 9,
    selected: false,
  }, {
    label: 'Liquidity',
    value: 60.64,
    percent: 8,
    selected: false,
  }, {
    label: 'Derivatives',
    value: 113.7,
    percent: 15,
    selected: false,
  }, {
    label: 'Comodities',
    value: 15.16,
    percent: 2,
    selected: false,
  }, {
    label: 'Fixed Income',
    value: 181.92,
    percent: 24,
    selected: false,
  }, {
    label: 'Other',
    value: 15.16,
    percent: 2,
    selected: false,
  }];

const color = d3.scaleOrdinal()
  .domain(data.map((item) => item.label))
  .range([
    '#edc8a3',
    '#edf0f0',
    '#bdc3c3',
    '#8d9697',
    '#d5d9da',
    '#e3e5e5',
    '#a5adad',
  ]);

const calculateAngle = (d) => d.startAngle + (d.endAngle - d.startAngle) / 2;

const createElement = (name, attrs = {}, value = []) => {
  let element = document.createElementNS(d3.namespaces.svg, name);

  for (let attr in attrs) {
    element.setAttribute(attr, attrs[attr]);
  }

  if(Array.isArray(value)) {
    for (let child of value) {
      element.appendChild(child);
    }
  } else {
    element.innerHTML = value || '';
  }

  return element;
};

const createLabelsStructure = (name, amount, percent, color) => {

  const groupPercent =
    createElement('g', { 'class': 'group-percent' }, [
      createElement('rect', { 'class': 'background', 'fill': color }),
      createElement('text', { 'class': 'percent', 'x': 34, 'dy': '1.4em' }, `${percent}%`),
    ]);

  const groupName =
    createElement('g', { 'class': 'group-name' }, [
      createElement('text', { 'class': 'name', 'dy': '.3em' }, name),
      createElement('text', { 'class': 'amount', 'dy': '.3em', 'y': 18 }, amount),
    ]);

  return createElement('g', { class: 'tick' }, [groupPercent, groupName]);
};

const createTitleStructure = (amount, percent) => {
  return createElement('g', { 'class': 'title', 'id': 'title' }, [
    createElement('text', { 'class': 'total-amount', 'x': 34, 'dy': '1.4em' }, amount),
    createElement('text', { 'class': 'total-percent', 'x': 34, 'dy': '1.4em' }, percent),
  ]);
};

const createSlices = (data) => {

  const slice = svg.select('.slices').selectAll('path.slice')
    .data(pie(data), key);

  slice.enter()
    .insert('path')
    .style('fill', (d, i) => color(i))
    .attr('class', 'slice')
    .attr('d', function (d) {

      const interpolate = Object.assign({}, d, {
        endAngle: 0,
        padAngle: 0,
        startAngle: 0
      });

      return arc(interpolate);
    })
    .on('click', function() {

      d3.select(this)
        .transition().duration(animation)
        .attrTween('d', function (d) {
          this._current = this._current || d;

          const interpolate = d3.interpolate(this._current, d);

          this._current = interpolate(0);

          d.data.selected = !d.data.selected;

          if(d.data.selected) {
            return (t) => selectedArc(interpolate(t));
          } else {
            return (t) => arc(interpolate(t));
          }
        });
    })
    .transition().duration(animation)
    .attrTween('d', function (d) {

      const interpolate = d3.interpolate({
        endAngle: 0,
        padAngle: 0,
        startAngle: 0
      }, d);

      if(d.data.selected) {
        return (t) => selectedArc(interpolate(t));
      } else {
        return (t) => arc(interpolate(t));
      }
    });

  slice.exit()
    .remove();
};

const createLabels = (data, amount, percent) => {

  const text = svg.select('.labels').selectAll('g.tick')
    .data(pie(data), key);

  text.enter()
    .append((d, i) => createLabelsStructure(d.data.label, '0M', 0, color(i)))
    .attr('transform', function (d) {

      const interpolate = d3.interpolate({
        endAngle: 0,
        padAngle: 0,
        startAngle: 0
      }, d);

      this._current = interpolate(0);

      const pos = outerArc.centroid(this._current);

      pos[0] = radius * (calculateAngle(this._current) < Math.PI ? 1 : -1);

      return `translate(${pos})`;

    })
    .attr('class', function (d) {

      const interpolate = d3.interpolate({
        endAngle: 0,
        padAngle: 0,
        startAngle: 0
      }, d);

      return calculateAngle(interpolate(0)) < Math.PI ? 'tick text-start' : 'tick text-end';
    })
    .transition().duration(animation)
    .attrTween('transform', function (d) {

      const interpolate = d3.interpolate({
        endAngle: 0,
        padAngle: 0,
        startAngle: 0
      }, d);

      return (t) => {

        const d2 = interpolate(t);
        const pos = outerArc.centroid(d2);

        pos[0] = radius * (calculateAngle(d2) < Math.PI ? 1 : -1);

        return `translate(${pos})`;
      };

    })
    .attrTween('class', function (d) {

      const interpolate = d3.interpolate({
        endAngle: 0,
        padAngle: 0,
        startAngle: 0
      }, d);

      return (t) => calculateAngle(interpolate(t)) < Math.PI ? 'tick text-start' : 'tick text-end';
    })
    .tween('text', function (d) {

      d.amount = amount;
      d.percent = percent;

      const interpolate = d3.interpolate({
        amount: 0,
        percent: 0,
        endAngle: 0,
        padAngle: 0,
        startAngle: 0,
        data: {
          percent: 0,
          value: 0
        }
      }, d);

      return function(t) {

        let i = interpolate(t);

        const index = d.index + 1;

        d3.select('text.total-amount')
          .text(i.amount.toFixed() + 'M');

        d3.select('text.total-percent')
          .text(i.percent.toFixed(1) + '%');

        d3.select('g.tick:nth-child('+index+') text.amount')
          .text(i.data.value.toFixed(2) + 'M');

        d3.select('g.tick:nth-child('+index+') text.percent')
          .text(i.data.percent.toFixed() + '%');
      };
    });

  text.exit()
    .remove();
};


const createPolylines = (data) => {
  const polyline = svg.select('.lines').selectAll('polyline')
    .data(pie(data), key);

  polyline.enter()
    .append('polyline')
    .attr('stroke', (d, i) => color(i))
    .attr('points', function (d) {

      const interpolate = Object.assign({}, d, {
        endAngle: 0,
        padAngle: 0,
        startAngle: 0
      });

      const pos = outerArc.centroid(interpolate);

      pos[0] = radius * 1 * (calculateAngle(interpolate) < Math.PI ? 1 : -1);

      return [arc.centroid(interpolate), outerArc.centroid(interpolate), pos];
    })
    .transition().duration(animation)
    .attrTween('points', function (d) {

      const interpolate = d3.interpolate({
        endAngle: 0,
        padAngle: 0,
        startAngle: 0
      }, d);

      return (t) => {

        const d2 = interpolate(t);
        const pos = outerArc.centroid(d2);

        pos[0] = radius * 1 * (calculateAngle(d2) < Math.PI ? 1 : -1);

        return [arc.centroid(d2), outerArc.centroid(d2), pos];
      };
    });

  polyline.exit()
    .remove();
};

const build = () => {

  svg.append('g')
    .attr('class', 'slices');

  svg.append('g')
    .attr('class', 'labels');

  svg.append('g')
    .attr('class', 'lines');

  svg.attr('transform', `translate(${width / 2}, ${height / 2})`);

  svg.append((d) => createTitleStructure(0, 0));

  change();
};

const change = () => {

  let total = 0;

  let _data = data.map((item) => {

    total += item.value;

    return item;
  });

  createSlices(_data);
  createLabels(_data, total, 100);
  createPolylines(_data);

};

build();
