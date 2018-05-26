
import "../stylesheet/app.css";

// Import tools
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';
import { default as ethUtil} from 'ethereumjs-util';
import { default as sigUtil} from 'eth-sig-util';



// import contract
import voting_contrac from '../../build/contracts/Voting.json'

var Voting = contract(voting_contrac);

let candidates = {"Luca": "candidate1", "Silvia": "candidate2", "Binki": "candidate3"}


// the actual vote is pushed to the chain for the user
window.submitVote = function(candidate) {
  let candidateName = $("#candidate-name").val();
  let signature = $("#voter-signature").val();
  let voterAddress = $("#voter-address").val();

  console.log(candidateName);
  console.log(signature);
  console.log(voterAddress);
  
  
  
  Voting.deployed().then(function(contractInstance) {
    contractInstance.voteForCandidate(candidateName, voterAddress, signature, {gas: 100000, from: web3.eth.accounts[0]}).then(function() {
      let div_id = candidates[candidateName];
      console.log(div_id);
      return contractInstance.totalVotesFor.call(candidateName).then(function(v) {
        console.log(v.toString());
        $("#" + div_id).html(v.toString());
        $("#msg").html("");
      });
    });
  });
}

window.voteForCandidate = function(candidate) {
  let candidateName = $("#candidate").val();

  let msgParams = [
    {
      type: 'vote',      
      name: 'preferencr',     
      value: 'Vote for ' + candidateName  
    }
  ]

  var from = web3.eth.accounts[0]

  var params = [msgParams, from]
  var method = 'eth_signTypedData'

  console.log("Hash is ");
  console.log(sigUtil.typedSignatureHash(msgParams));

  // the vote is signed eth_signTypedData
  web3.currentProvider.sendAsync({
    method,
    params,
    from,
  }, function (err, result) {
    if (err) return console.dir(err)
    if (result.error) {
      alert(result.error.message)
    }
    if (result.error) return console.error(result)
   
    console.log('PERSONAL SIGNED:' + JSON.stringify(result.result)) // to use to send the real vote to chain
  })
}

$( document ).ready(function() {
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source like Metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    // probably use metamask
    // fallback  strategy 
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  Voting.setProvider(web3.currentProvider);
  let candidateNames = Object.keys(candidates);
  for (var i = 0; i < candidateNames.length; i++) {
    let name = candidateNames[i];
    Voting.deployed().then(function(contractInstance) {
      contractInstance.totalVotesFor.call(name).then(function(v) {
        $("#" + candidates[name]).html(v.toString());
      });
    })
  }
});
