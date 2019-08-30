<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \Pusher\Pusher;
use App\User;

class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $users = User::all();
        $usersData = [];

        foreach($users as $user){
            $usersData[$user->id] = [
                'id'=>$user->id,
                'name'=>$user->name,
                'online'=> ($user->isOnline()) ? true : false
            ];
        }

        return view('home',[
            'usersData'=>$usersData
        ]);
    }
    
    public function authenticate(Request $request){
        $socketId = $request->socket_id;
        $channelName = $request->channel_name;
        $options = array(
            'cluster' => 'eu',
            'useTLS' => true
        );
        $pusher = new Pusher('d982143261a3990630af', '5efcaf8f350d8609e6ee', '843389', $options);

        $presence_data = ['name' => auth()->user()->name];
        $key = $pusher->presence_auth($channelName, $socketId, auth()->id(), $presence_data);
        return response($key);
    }
    
}
