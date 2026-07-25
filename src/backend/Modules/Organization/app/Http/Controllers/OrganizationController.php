<?php

namespace Modules\Organization\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function index()
    {
        return view('organization::index');
    }

    public function create()
    {
        return view('organization::create');
    }

    public function store(Request $request)
    {
    }

    public function show($id)
    {
        return view('organization::show');
    }

    public function edit($id)
    {
        return view('organization::edit');
    }

    public function update(Request $request, $id)
    {
    }

    public function destroy($id)
    {
    }
}