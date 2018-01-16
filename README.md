### About

Department of Energy Grid Modernization Laboratory Consortium (GMLC) is working on Project 1.3.5, “DER Siting and Optimization tool to enable large scale deployment of DER in California”. The goal of the project is to develop a prototype software framework to couple behind-the-meter DER adoption models with transmission and distribution power flow co-simulation models, supported by spatial visualization of results. This document describes uses cases to test the software prototype.

Different states throughout the country are developing aggressive DER penetration targets. California is in the forefront of those efforts with statewide goals to integrate 15GW of distributed energy resources, including 12 GW of renewable energy, into distribution systems. These ambitious goals require overcoming challenges created by the lack of comprehensive tools to understand most cost-effective locations DER and impact on overall-system reliability.

The development of a prototype software framework leverages existing capabilities currently available at the different National Labs participating in this project. Specifically, an upgraded and customized version of Lawrence Berkeley National Laboratory's behind-the-meter DER optimization engine DER-CAM1 is used to find the most cost-effective behind-the-meter distributed generation and storage solutions and estimate private DER adoption patterns throughout distribution networks. These DER adoption results and corresponding dispatch decisions are integrated with Lawrence Livermore National Laboratory’s Transmission and Distribution co-simulation platform, ParGrid2, that couples GridLAB-D3 distribution level network models with GriDyn4 transmission level network models and allows estimating DER impacts throughout the electric grid. DER adoption results, as well DER dispatch and system level impacts are visualized through a mapping and visualization platform developed by SLAC.

One of the key challenges created by large scale deployment of DER in distribution grids is the need to accommodate for potentially drastic changes in both grid planning and operations. Widespread rooftop PV, for instance, is currently leading to a phenomenon commonly referred to as the “duck curve”, reflecting the dramatic changes in net loads during afternoon hours of PV production.

### Installation and Requirements

To install and use the web application built to visualize the data as part of this project, you need Python 3 with packages included as part of the requirements.txt file.
Using pip:
```sh
pip install -r requirements.txt
```
Then, under the GMLCDjangoProject, run the following command:
```sh
python manage.py runserver
```
The web application run at the default ip and port (127.0.0.1:8000).
