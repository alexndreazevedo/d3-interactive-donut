const width = 960;
const height = 480;
const radius = Math.min(width, height) / 2;
const animation = 1000;

const svg = d3.select('body')
  .append('svg')
    .attr('viewBox', [0, 0, width, height].join(' '))
  .append('g')

const pie = d3.layout.pie()
  .sort(null)
  .value((d) => d.value);

const key = (d) => d.data.label;

const arc = d3.svg.arc()
  .outerRadius(radius * 0.8)
  .innerRadius(radius * 0.5);

const selectedArc = d3.svg.arc()
  .outerRadius(radius * 0.85)
  .innerRadius(radius * 0.55);

const outerArc = d3.svg.arc()
  .innerRadius(radius * 0.9)
  .outerRadius(radius * 0.85);

const data = [{
    label: 'Stocks',
    value: 335.6,
    percent: 44,
    selected: false,
  }, {
    label: 'Property',
    value: 33,
    percent: 9,
    selected: false,
  }, {
    label: 'Liquidity',
    value: 64.4,
    percent: 8,
    selected: false,
  }, {
    label: 'Derivatives',
    value: 108,
    percent: 14,
    selected: false,
  }, {
    label: 'Comodities',
    value: 15.1,
    percent: 2,
    selected: false,
  }, {
    label: 'Fixed Income',
    value: 166.8,
    percent: 22,
    selected: false,
  }, {
    label: 'Other',
    value: 3.5,
    percent: 1,
    selected: false,
  }];

const color = d3.scale.ordinal()
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
  let element = document.createElementNS(d3.ns.prefix.svg, name);

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
  return createElement('g', { 'class': 'title' }, [
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
    });

  slice
    .transition().duration(animation)
    .attrTween('d', function (d) {

      this._current = this._current || d;

      const interpolate = d3.interpolate(this._current, d);

      this._current = interpolate(0);

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
    .append((d, i) => createLabelsStructure(d.data.label, d.data.value, d.data.value, color(i)));

  text
    .transition().duration(animation)
    .attrTween('transform', function (d) {

      this._current = this._current || d;

      const interpolate = d3.interpolate(this._current, d);

      this._current = interpolate(0);

      return (t) => {

        const d2 = interpolate(t);
        const pos = outerArc.centroid(d2);

        pos[0] = radius * (calculateAngle(d2) < Math.PI ? 1 : -1);

        return `translate(${pos})`;
      };

    })
    .attrTween('class', function (d) {

      this._current = this._current || d;

      const interpolate = d3.interpolate(this._current, d);

      this._current = interpolate(0);

      return (t) => calculateAngle(interpolate(t)) < Math.PI ? 'tick text-start' : 'tick text-end';
    })
    .tween('text', function (d) {

      d.amount = amount;
      d.percent = percent;

      this._current = this._current || d;

      const interpolate = d3.interpolate(this._current, d);

      this._current = interpolate(0);

      return function(t) {

        let i = interpolate(t);

        d3.select('text.total-amount')
          .text(i.amount.toFixed(1) + 'M');

        d3.select('text.total-percent')
          .text(i.percent.toFixed(1) + '%');

        d3.select(this).select('text.amount')
          .text(i.data.value.toFixed(1) + 'M');

        d3.select(this).select('text.percent')
          .text(i.data.percent.toFixed(1) + '%');
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
    .attr('stroke', (d, i) => color(i));

  polyline.transition().duration(animation)
    .attrTween('points', function (d) {

      this._current = this._current || d;

      const interpolate = d3.interpolate(this._current, d);

      this._current = interpolate(0);

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
  createLabels(_data, total, (total / 100) * Math.random());
  createPolylines(_data);

};

build();
