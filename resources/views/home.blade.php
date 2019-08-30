@extends('layouts.app')

@section('header')
<script>
    window.usersdata = @json($usersData)
</script>
@endsection

@section('content')
<div id="app"></div>
@endsection
