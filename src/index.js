import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
const axios = require('axios');


function Anchor(props){
  return(
    <a href="#" onClick={props.handleAnchorClick} className={props.className}>{props.number}</a>
  )
}


class Search extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      value: '',
      pagination: true,
      activePage: 1,
      anchors: Array(5).fill(null),
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleAnchorClick = this.handleAnchorClick.bind(this);
  }

  async search_items(itemToSearch){
    const retrievedItems = Array(this.props.limit).fill(null);
    const offset = this.state.activePage * 10;
    const response = await axios.get("https://api.mercadolibre.com/sites/MCO/search?q=" + itemToSearch + "&limit=" + this.props.limit + "&offset=" + offset, {
    timeout: 1000,
    headers: {
      'Authorization': 'Bearer $ACCESS_TOKEN',
    },
    responseType: 'json',
    })
    .then(function(response){
      return(response.data)
    })
    .catch(function(error){
      return({results: "error"})
    })
    return(response.results)
  }

  handleChange(event) {    
    this.setState({value: event.target.value});  
  }

  async handleSearch(event) {
    event.preventDefault();
    if(this.state.value == ""){
      return(0)
    }
    let results = await this.search_items(this.state.value)
    if(results == "error"){
      console.log("It was not possible to retrieve data.")
      return(0)
    }
    this.props.handleSearchClick(results)
    this.renderPaginator();
  }

  async handleAnchorClick(i){
    this.setState({activePage: i})
    if(this.state.value == ""){
      return(0)
    }
    let results = await this.search_items(this.state.value)
    if(results == "error"){
      console.log("It was not possible to retrieve data.")
      return(0)
    }
    this.props.handleSearchClick(results)
    this.renderPaginator();
  }

  renderAnchor(i){
    const className = this.state.activePage == i ? "active" : "inactive"
    return (
      <Anchor
        handleAnchorClick={() => this.handleAnchorClick(i)}
        number={i}
        className={className}
      />
    );
  }

  renderPaginator(){
    const anchors = this.state.anchors.slice();
    if(this.state.activePage <= 3){
      for(let i = 0; i < this.state.anchors.length; i++){
        anchors[i] = this.renderAnchor(i+1)
      }
    } else{
      for(let i = this.state.activePage-1; i < this.state.activePage+2; i++){
        anchors[i-this.state.activePage-1] = this.renderAnchor(i+1)
      }
    }
    this.setState({anchors: anchors})
  }

  render(){
    return(
      <div className="search_div">
        <table className="search_table">
          <thead>
            <tr>
              <td>
                <form onSubmit={this.handleSearch}>        
                  <h3 className="search_h3">Producto:</h3>
                  <input type="text" value={this.state.value} onChange={this.handleChange}/>
                  <input className="search_submit" type="submit" value="Buscar"/>
                </form>
              </td>
              <td>
              <div className="pagination">
                {this.state.anchors}
              </div>
              </td>
            </tr>
          </thead>
          
        </table>
      </div>
    )
  }
}


function Item(props){
  return(
    <div>
      <table class ="item_table">
        <thead>
        <tr className="item_table_row">
          <td className="item_td_left"><img src={props.image} width="100" height="100"></img></td>
          <td className="item_td_right">
            <ul className="item_unordered_list">
              <h3>{props.name}</h3>
              <li>Precio: ${props.price}</li>
              <li>Vendedor: {props.seller}</li>
            </ul>
          </td>
        </tr>
        <tr className="item_table_row">
          <td className="item_td_button" colSpan="2"><button className="item_button">Más información</button></td>
        </tr>
        </thead>
      </table>
    </div>
  );
}


async function search_user(user_id){
  const response = await axios.get("https://api.mercadolibre.com/users/" + user_id, {
  timeout: 1000,
  headers: {
    'Authorization': 'Bearer $ACCESS_TOKEN',
  },
  responseType: 'json',
  })
  .then(function(response){
    return(response.data)
  })
  .catch(function(error){
    console.log(error)
  })
  return(response.nickname)
}


function formatPrice(unformatted_price){
  const price = unformatted_price.toString();
  let formattedPrice = ""
  for(let i = price.length; i >= 0; i--){
    if(i != price.length && (i-price.length+1)%3 == 0){
      formattedPrice += "."
    }
    formattedPrice += price[i];
  }
  formattedPrice = formattedPrice.split("").reverse().join("")
  formattedPrice = formattedPrice.substring(0, (formattedPrice.length-10))
  return(formattedPrice)
}


/*
  render() {
    return (
      <div className={this.props.pagination ? "pagination" : "hide_pagination"}>
        <a href="#">&laquo;</a>
        <a href="#">1</a>
        <a className="active" href="#">2</a>
        <a href="#">3</a>
        <a href="#">4</a>
        <a href="#">5</a>
        <a href="#">&raquo;</a>
      </div>
    );
  }
}
*/

class Shop extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      items: Array(10).fill(null),
    }
    this.handleSearchClick = this.handleSearchClick.bind(this);
  }

  renderItem(item) {
    return (
      <Item
        image={item.item_image}
        name={item.item_name}
        price={item.item_price}
        seller={item.item_seller}
      />
    );
  }

  async handleSearchClick(results) {
    const items = this.state.items.slice();
    for(let i = 0; i < results.length; i++){
      const seller_name = await search_user(results[i].seller.id)
      const formatted_price = formatPrice(results[i].price)
      const item = {
        item_id: results[i].id,
        item_price: formatted_price,
        item_name: results[i].title,
        item_image: results[i].thumbnail,
        item_seller_id: results[i].seller.id,
        item_seller: seller_name,
      }
      items[i] = this.renderItem(item)
    }
    this.setState({items: items})
  }


  //<div className="render_items_div">{this.renderItems()}</div>
  render() {
    return (
      <div className="shop">
        <link rel="shortcut icon" href="#"></link>
        <div className="shop-board">
          <Search 
            limit={this.state.items.length}
            handleSearchClick={this.handleSearchClick}
          />
          <div className="render_items_div">{this.state.items}</div>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Shop />,
  document.getElementById('root')
);  