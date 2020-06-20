import React, { Component } from "react";
import { Line, Bar, LinePath } from "@vx/shape";
import { withTooltip, Tooltip } from "@vx/tooltip";
import { localPoint } from "@vx/event";
import { scaleTime, scaleLinear } from "@vx/scale";
import { extent, max, bisector } from "d3-array";
import { timeFormat } from "d3-time-format";
import Infobox from './Infobox';
import  style from './App.css';

const width = window.innerWidth;
const height = window.innerHeight;

const formatDate = timeFormat("%b %d, '%y");
const xSelector = d => new Date(d.date);
const ySelector = d => d.price;

const bisectDate = bisector(xSelector).left;

class App extends Component {
  state = {
    data: null,
  };
  async componentDidMount() {
    const res = await fetch("https://api.coindesk.com/v1/bpi/historical/close.json");
    const data = await res.json();

    this.setState({
      data: Object.keys(data.bpi).map(date => {
        return {
          date,
          price: data.bpi[date],
        };
      }),
    });
  }

  handleTooltip = ({ event, data, xSelector, xScale, yScale }) => {
    const { showTooltip } = this.props;
    const { x } = localPoint(event);
    const x0 = xScale.invert(x);
    const index = bisectDate(data, x0, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    let d = d0;
    if (d1 && d1.date) {
      d = x0 - xSelector(d0) > xSelector(d1) - x0 ? d1 : d0;
    }
    showTooltip({
      tooltipData: d,
      tooltipLeft: xScale(xSelector(d)),
      tooltipTop: yScale(ySelector(d)),
    });
  };

  render() {
    const { data } = this.state;
    const { showTooltip, hideTooltip, tooltipData, tooltipTop, tooltipLeft } = this.props;

    if (!data) return null;

    const padding = 100;
    const xMax = width - padding;
    const yMax = height - padding;

    const xScale = scaleTime({
      range: [padding, xMax],
      domain: extent(data, xSelector),
    });

    const dataMax = max(data, ySelector);
    const yScale = scaleLinear({
      range: [yMax, padding],
      domain: [0, dataMax + dataMax / 3],
    });

    return (
      <div id="root"> 
        <h3>30-Day Bitcoin Price Graph</h3>

        <div className='row'>
          { !this.state.fetchingData ?
          <Infobox data={this.state.data} />
          : null }
        </div>
        <svg width={width} height={height}>
          <rect x={0} y={0} width={width} height={height} fill="black" />
          <LinePath
            data={data}
            xScale={xScale}
            yScale={yScale}
            x={xSelector}
            y={ySelector}
            strokeWidth={2}
            stroke="#FFF"
            strokeLinecap="round"
            fill="transparent"
          />
          <Bar
            x={0}
            y={0}
            width={width}
            height={height}
            fill="transparent"
            data={data}
            onMouseMove={data => event =>
              this.handleTooltip({
                event,
                data,
                xSelector,
                xScale,
                yScale,
              })}
            onMouseLeave={data => event => hideTooltip()}
            onTouchEnd={data => event => hideTooltip()}
            onTouchMove={data => event =>
              this.handleTooltip({
                event,
                data,
                xSelector,
                xScale,
                yScale,
              })}
          />
          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: 0 }}
                to={{ x: tooltipLeft, y: yMax }}
                stroke="white"
                strokeWidth={1.5}
                style={{ pointerEvents: "none" }}
                strokeDasharray="1"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={1.5}
                fill="white"
                stroke="white"
                strokeWidth={1.5}
                style={{ pointerEvents: "none" }}
              />
            </g>
          )}
        </svg>
        {tooltipData && (
          <div>
            <Tooltip
              top={tooltipTop - 12}
              left={tooltipLeft + 12}
              style={{
                backgroundColor: "#FFF",
                color: "black",
              }}
            >
              {`$${ySelector(tooltipData)}`}
            </Tooltip>
            <Tooltip
              top={yMax - 20}
              left={tooltipLeft}
              style={{
                transform: "translateX(-50%)",
                color: "black",
              }}
            >
              {formatDate(xSelector(tooltipData))}
            </Tooltip>
          </div>
        )}
      </div>
    );
  }
}

export default withTooltip(App);
